import { NextRequest, NextResponse } from "next/server";
import getDb from "@/app/utils/db";
import { pusherServer } from "@/app/utils/pusher";

export const dynamic = "force-dynamic";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Ensure chat table exists
async function ensureChatTable(db: any) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ccms_employee_chats (
      CM_Chat_ID INT AUTO_INCREMENT PRIMARY KEY,
      CM_Sender_ID VARCHAR(255) NOT NULL,
      CM_Receiver_ID VARCHAR(255) NOT NULL,
      CM_Message TEXT NOT NULL,
      CM_Image_URL VARCHAR(500) DEFAULT NULL,
      CM_Is_Read TINYINT(1) DEFAULT 0,
      CM_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sender_receiver (CM_Sender_ID, CM_Receiver_ID),
      INDEX idx_receiver (CM_Receiver_ID)
    );
  `;
  await db.query(createTableQuery);
}

// GET: Fetch list of employees with recent chat info & unread message count
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    connection = await getDb();
    await ensureChatTable(connection);

    // Update last active online timestamp for current user
    try {
      await connection.execute(`UPDATE ccms_users SET CM_Last_Seen = NOW() WHERE CM_User_ID = ?`, [userId]);
    } catch (err: any) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        await connection.execute(`ALTER TABLE ccms_users ADD COLUMN CM_Last_Seen DATETIME DEFAULT NULL`);
        await connection.execute(`UPDATE ccms_users SET CM_Last_Seen = NOW() WHERE CM_User_ID = ?`, [userId]);
      }
    }

    // Fetch all active users except the current logged-in user
    let userQuery = `
      SELECT 
        u.CM_User_ID,
        u.CM_Full_Name,
        u.CM_Phone_Number,
        u.CM_Email,
        u.CM_Photo_URL,
        u.CM_Is_Active,
        u.CM_Last_Seen,
        u.CM_Current_Project_ID,
        p.CM_Project_Name AS CM_Current_Project_Name,
        r.CM_Role_Description
      FROM ccms_users AS u
      LEFT JOIN ccms_roles_master AS r 
        ON u.CM_Role_ID = r.CM_Role_ID
      LEFT JOIN ccms_projects AS p
        ON u.CM_Current_Project_ID = p.CM_Project_ID
      WHERE u.CM_User_ID != ? 
      AND u.CM_Is_Active = 'Active'
    `;



    const userParams: any[] = [userId];

    if (search.trim()) {
      userQuery += ` AND (u.CM_Full_Name LIKE ? OR r.CM_Role_Description LIKE ? OR u.CM_Phone_Number LIKE ?)`;
      userParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    userQuery += ` ORDER BY u.CM_Full_Name ASC`;

    const [usersRows] = await connection.execute(userQuery, userParams);
    const employees = usersRows as any[];

    // Fetch latest message & unread count for each employee
    const employeesWithChat = await Promise.all(
      employees.map(async (emp) => {
        // Last message
        const [msgRows] = await connection.query(
          `SELECT CM_Message, CM_Image_URL, CM_Sender_ID, CM_Created_At 
           FROM ccms_employee_chats 
           WHERE (CM_Sender_ID = ? AND CM_Receiver_ID = ?) 
              OR (CM_Sender_ID = ? AND CM_Receiver_ID = ?) 
           ORDER BY CM_Created_At DESC LIMIT 1`,
          [userId, emp.CM_User_ID, emp.CM_User_ID, userId]
        );
        const lastMsg = (msgRows as any[])[0] || null;

        // Unread count
        const [unreadRows] = await connection.query(
          `SELECT COUNT(*) as count 
           FROM ccms_employee_chats 
           WHERE CM_Sender_ID = ? AND CM_Receiver_ID = ? AND CM_Is_Read = 0`,
          [emp.CM_User_ID, userId]
        );
        const unreadCount = (unreadRows as any[])[0]?.count || 0;

        return {
          ...emp,
          lastMessage: lastMsg?.CM_Message || (lastMsg?.CM_Image_URL ? "📷 Attachment" : null),
          lastMessageDate: lastMsg?.CM_Created_At || null,
          lastMessageSender: lastMsg?.CM_Sender_ID || null,
          unreadCount,
        };
      })
    );

    // Fetch latest group message
    const [groupMsgRows] = await connection.query(
      `SELECT CM_Message, CM_Image_URL, CM_Sender_ID, CM_Created_At 
       FROM ccms_employee_chats 
       WHERE CM_Receiver_ID = 'GROUP_ALL' 
       ORDER BY CM_Created_At DESC LIMIT 1`
    );
    const groupLastMsg = (groupMsgRows as any[])[0] || null;

    employeesWithChat.push({
      CM_User_ID: "GROUP_ALL",
      CM_Full_Name: "CS Squad",
      CM_Role_Description: "Group Chat",
      CM_Photo_URL: null,
      isGroup: true,
      lastMessage: groupLastMsg?.CM_Message || (groupLastMsg?.CM_Image_URL ? "📷 Attachment" : null),
      lastMessageDate: groupLastMsg?.CM_Created_At || null,
      lastMessageSender: groupLastMsg?.CM_Sender_ID || null,
      unreadCount: 0,
    });

    // Sort: employees with recent messages first (Group chat always pinned to top)
    employeesWithChat.sort((a, b) => {
      if (a.isGroup) return -1;
      if (b.isGroup) return 1;

      if (a.lastMessageDate && b.lastMessageDate) {
        return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
      }
      if (a.lastMessageDate) return -1;
      if (b.lastMessageDate) return 1;
      return a.CM_Full_Name.localeCompare(b.CM_Full_Name);
    });

    const res = NextResponse.json({ success: true, employees: employeesWithChat });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("Error fetching chat employees:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Send direct chat message to an employee
export async function POST(request: NextRequest) {
  let connection;
  try {
    const formData = await request.formData();
    const senderId = formData.get("senderId") as string;
    const receiverId = formData.get("receiverId") as string;
    const message = (formData.get("message") as string) || "";
    const providedDate = formData.get("date") as string;
    const file = formData.get("file") as File;

    if (!senderId || !receiverId || (!message && !file)) {
      return NextResponse.json(
        { success: false, error: "senderId, receiverId, and message/file required" },
        { status: 400 }
      );
    }

    connection = await getDb();

    let imageUrl: string | null = null;
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const uploadDir = join(process.cwd(), "public", "uploads", "chat");
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/chat/${fileName}`;
    }

    const providedProjectId = formData.get("projectId") as string;
    let activeProject = providedProjectId || null;

    let createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let logDateOnly = new Date().toISOString().split("T")[0]; // default today for worklogs

    if (providedDate) {
      if (providedDate.includes('T')) {
        // providedDate is from a datetime-local input: "YYYY-MM-DDTHH:mm"
        createdAt = providedDate.replace('T', ' ') + ':00'; // append seconds
        logDateOnly = providedDate.split('T')[0];
      } else {
        // Legacy fallback if it's just a date
        const now = new Date();
        createdAt = `${providedDate} ${now.toTimeString().split(' ')[0]}`;
        logDateOnly = providedDate;
      }
    }

    const [result] = await connection.execute(
      `INSERT INTO ccms_employee_chats (CM_Sender_ID, CM_Receiver_ID, CM_Message, CM_Project_ID, CM_Image_URL, CM_Created_At)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [senderId, receiverId, message, activeProject, imageUrl, createdAt]
    );

    const chatId = (result as any).insertId;

    const [newMsgRows] = await connection.query(
      `SELECT * FROM ccms_employee_chats WHERE CM_Chat_ID = ?`,
      [chatId]
    );

    // --- BRIDGE: Automatically log work if sender has an active project ---
    try {
      // If they have an active project and actually sent a text message, log it
      if (activeProject && message.trim()) {
        await connection.execute(
          `INSERT INTO ccms_project_work_logs (WL_Project_ID, WL_User_ID, WL_Date, WL_Hours, WL_Description)
           VALUES (?, ?, ?, 0, ?)`,
          [activeProject, senderId, logDateOnly, message.trim()]
        );
      }
    } catch (bridgeErr) {
      console.error("Error in chat-to-worklog bridge:", bridgeErr);
    }
    // ----------------------------------------------------------------------

    // --- PUSHER TRIGGER ---
    try {
      const savedMessage = (newMsgRows as any[])[0];
      await pusherServer.trigger(
        `private-user-${receiverId}`,
        "new_message",
        { message: savedMessage }
      );
    } catch (pusherErr) {
      console.error("Error triggering pusher event:", pusherErr);
    }
    // ----------------------

    const res = NextResponse.json({
      success: true,
      message: (newMsgRows as any[])[0],
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { chatId, senderId, message, date, projectId } = await request.json();

    if (!chatId || !senderId || !message) {
      return NextResponse.json(
        { success: false, error: "chatId, senderId, and message required" },
        { status: 400 }
      );
    }

    const connection = await getDb();

    // Verify sender owns the message
    const [existing] = await connection.query(
      `SELECT CM_Sender_ID FROM ccms_employee_chats WHERE CM_Chat_ID = ?`,
      [chatId]
    );

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (String((existing as any[])[0].CM_Sender_ID) !== String(senderId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const activeProject = projectId || null;

    if (date) {
      let createdAt = date;
      if (date.includes('T')) {
        createdAt = date.replace('T', ' ');
        if (createdAt.length === 16) createdAt += ':00'; // add seconds if missing
      }

      await connection.execute(
        `UPDATE ccms_employee_chats SET CM_Message = ?, CM_Created_At = ?, CM_Project_ID = ? WHERE CM_Chat_ID = ?`,
        [message, createdAt, activeProject, chatId]
      );
    } else {
      await connection.execute(
        `UPDATE ccms_employee_chats SET CM_Message = ?, CM_Project_ID = ? WHERE CM_Chat_ID = ?`,
        [message, activeProject, chatId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating chat message:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const senderId = searchParams.get('senderId');

    if (!chatId || !senderId) {
      return NextResponse.json(
        { success: false, error: "chatId and senderId required" },
        { status: 400 }
      );
    }

    const connection = await getDb();

    // Verify sender owns the message
    const [existing] = await connection.query(
      `SELECT CM_Sender_ID FROM ccms_employee_chats WHERE CM_Chat_ID = ?`,
      [chatId]
    );

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (String((existing as any[])[0].CM_Sender_ID) !== String(senderId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connection.execute(
      `DELETE FROM ccms_employee_chats WHERE CM_Chat_ID = ?`,
      [chatId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting chat message:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
