import { NextResponse, NextRequest } from 'next/server';
import getDb from '@/app/utils/db';

/**
 * Validates godown data
 * @param data The godown data to validate
 * @returns Error message string or null if validation passes
 */
const validateGodownData = (data: any): string | null => {
  // Required fields
  const requiredFields = [
    'CM_Godown_Code',
    'CM_Company_ID',
    'CM_Godown_Name',
    'CM_Location',
    'CM_Address',
    'CM_District',
    'CM_State',
    'CM_Country',
    'CM_Postal_Code',
    'CM_Contact_Person',
    'CM_Phone_Number',
    'CM_Email',
    'CM_Is_Status'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return `${field.replace('CM_', '')} is required`;
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.CM_Email && !emailRegex.test(data.CM_Email)) {
    return 'Invalid email format';
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\d{10,15}$/;
  if (data.CM_Phone_Number && !phoneRegex.test(data.CM_Phone_Number.replace(/[-()\s]/g, ''))) {
    return 'Invalid phone number format';
  }

  if (data.CM_Alternate_Phone && !phoneRegex.test(data.CM_Alternate_Phone.replace(/[-()\s]/g, ''))) {
    return 'Invalid alternate phone number format';
  }

  // Validate status
  if (data.CM_Is_Status && !['Active', 'Inactive'].includes(data.CM_Is_Status)) {
    return 'Status must be either Active or Inactive';
  }

  return null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validationError = validateGodownData(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      CM_Godown_Code,
      CM_Company_ID,
      CM_Godown_Name,
      CM_Location,
      CM_Address,
      CM_District,
      CM_State,
      CM_Country,
      CM_Postal_Code,
      CM_Contact_Person,
      CM_Phone_Number,
      CM_Alternate_Phone,
      CM_Email,
      CM_Is_Status
    } = body;

    const db = await getDb();

    // Check if godown code already exists
    const [existingGodowns] = await db.query(
      'SELECT CM_Godown_ID FROM ccms_godown WHERE CM_Godown_Code = ?',
      [CM_Godown_Code]
    );

    if (Array.isArray(existingGodowns) && existingGodowns.length > 0) {
      const res = NextResponse.json({ error: 'Godown code already exists' }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }

    // Generate unique ID for the godown

    const currentDateTime = new Date();

    // Get user information - this would typically come from your auth system
    // For now, we'll use a placeholder
    const currentUser = 'system'; // Replace with actual user information when you implement authentication

    // Insert new godown record
    await db.query(
      `INSERT INTO ccms_godown (
    
        CM_Godown_Code, 
        CM_Company_ID, 
        CM_Godown_Name, 
        CM_Location, 
        CM_Address, 
        CM_District, 
        CM_State, 
        CM_Country, 
        CM_Postal_Code, 
        CM_Contact_Person, 
        CM_Phone_Number, 
        CM_Alternate_Phone, 
        CM_Email, 
        CM_Is_Status, 
        CM_Created_By, 
        CM_Created_At
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [

        CM_Godown_Code,
        CM_Company_ID,
        CM_Godown_Name,
        CM_Location,
        CM_Address,
        CM_District,
        CM_State,
        CM_Country,
        CM_Postal_Code,
        CM_Contact_Person,
        CM_Phone_Number,
        CM_Alternate_Phone || null,
        CM_Email,
        CM_Is_Status,
        currentUser,
        currentDateTime
      ]
    );

    const res = NextResponse.json({
      success: true,
      message: 'Godown created successfully',
    }, { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;

  } catch (error) {
    console.error('Error creating godown:', error);
    const res = NextResponse.json({
      success: false,
      message: 'Failed to create godown',
      error: (error as Error).message
    }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
