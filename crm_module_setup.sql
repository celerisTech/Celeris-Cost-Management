-- =====================================================
-- CRM / SALES MANAGEMENT MODULE - DATABASE SCHEMA
-- =====================================================
-- Tables: ccms_sales_lead, ccms_sales_visit, ccms_sales_payment, ccms_sales_project_conversion
-- Activity Log: ccms_sales_activity_log
-- =====================================================

-- 1. SALES LEAD TABLE
CREATE TABLE IF NOT EXISTS ccms_sales_lead (
  CM_Lead_ID VARCHAR(20) NOT NULL,
  CM_Client_Name VARCHAR(150) NOT NULL,
  CM_Company_Name VARCHAR(200) DEFAULT NULL,
  CM_Phone VARCHAR(20) NOT NULL,
  CM_Alt_Phone VARCHAR(20) DEFAULT NULL,
  CM_Email VARCHAR(150) DEFAULT NULL,
  CM_Address TEXT DEFAULT NULL,
  CM_City VARCHAR(100) DEFAULT NULL,
  CM_Lead_Source VARCHAR(100) DEFAULT NULL,
  CM_Product_Required VARCHAR(200) DEFAULT NULL,
  CM_Project_Type VARCHAR(100) DEFAULT NULL,
  CM_Expected_Budget DECIMAL(15,2) DEFAULT NULL,
  CM_Sales_Executive_ID VARCHAR(20) DEFAULT NULL,
  CM_Lead_Status ENUM('New Lead','Visited','Demo Given','Proposal Sent','Negotiation','Converted','Rejected','On Hold') DEFAULT 'New Lead',
  CM_Remarks TEXT DEFAULT NULL,
  CM_Is_Deleted TINYINT(1) DEFAULT 0,
  CM_Created_By VARCHAR(20) DEFAULT NULL,
  CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  CM_Updated_By VARCHAR(20) DEFAULT NULL,
  CM_Updated_At DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (CM_Lead_ID),
  INDEX idx_lead_status (CM_Lead_Status),
  INDEX idx_lead_executive (CM_Sales_Executive_ID),
  INDEX idx_lead_created (CM_Created_At),
  INDEX idx_lead_city (CM_City),
  INDEX idx_lead_deleted (CM_Is_Deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SALES VISIT TABLE
CREATE TABLE IF NOT EXISTS ccms_sales_visit (
  CM_Visit_ID VARCHAR(20) NOT NULL,
  CM_Lead_ID VARCHAR(20) NOT NULL,
  CM_Sales_Executive_ID VARCHAR(20) DEFAULT NULL,
  CM_Visit_Date DATE NOT NULL,
  CM_Purpose VARCHAR(300) DEFAULT NULL,
  CM_Product_Discussed VARCHAR(300) DEFAULT NULL,
  CM_Scope_Given TEXT DEFAULT NULL,
  CM_Demo_Given ENUM('Yes','No') DEFAULT 'No',
  CM_Proposal_Value DECIMAL(15,2) DEFAULT NULL,
  CM_GST_Type VARCHAR(50) DEFAULT NULL,
  CM_Visit_Count INT DEFAULT 1,
  CM_Scope_Alteration TEXT DEFAULT NULL,
  CM_Value_Alteration DECIMAL(15,2) DEFAULT NULL,
  CM_Further_Enhancement TEXT DEFAULT NULL,
  CM_Issues_Raised TEXT DEFAULT NULL,
  CM_Project_Handed_Over ENUM('Yes','No') DEFAULT 'No',
  CM_Trial_Version_Given ENUM('Yes','No') DEFAULT 'No',
  CM_Next_Followup_Date DATE DEFAULT NULL,
  CM_Visit_Status ENUM('Follow-up Needed','Interested','Not Interested','Proposal Sent','Converted') DEFAULT 'Follow-up Needed',
  CM_Remarks TEXT DEFAULT NULL,
  CM_Images JSON DEFAULT NULL,
  CM_Is_Deleted TINYINT(1) DEFAULT 0,
  CM_Created_By VARCHAR(20) DEFAULT NULL,
  CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  CM_Updated_By VARCHAR(20) DEFAULT NULL,
  CM_Updated_At DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (CM_Visit_ID),
  INDEX idx_visit_lead (CM_Lead_ID),
  INDEX idx_visit_executive (CM_Sales_Executive_ID),
  INDEX idx_visit_date (CM_Visit_Date),
  INDEX idx_visit_followup (CM_Next_Followup_Date),
  INDEX idx_visit_status (CM_Visit_Status),
  INDEX idx_visit_deleted (CM_Is_Deleted),
  CONSTRAINT fk_visit_lead FOREIGN KEY (CM_Lead_ID) REFERENCES ccms_sales_lead(CM_Lead_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SALES PAYMENT TABLE
CREATE TABLE IF NOT EXISTS ccms_sales_payment (
  CM_Payment_ID VARCHAR(20) NOT NULL,
  CM_Lead_ID VARCHAR(20) NOT NULL,
  CM_Payment_Date DATE NOT NULL,
  CM_Payment_Type ENUM('Advance','Partial Payment','Final Payment') DEFAULT 'Advance',
  CM_Amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  CM_Payment_Mode VARCHAR(50) DEFAULT NULL,
  CM_Reference_Number VARCHAR(100) DEFAULT NULL,
  CM_Payment_Status ENUM('Pending','Paid','Failed') DEFAULT 'Pending',
  CM_Receipt_URL VARCHAR(500) DEFAULT NULL,
  CM_Remarks TEXT DEFAULT NULL,
  CM_Is_Deleted TINYINT(1) DEFAULT 0,
  CM_Created_By VARCHAR(20) DEFAULT NULL,
  CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  CM_Updated_By VARCHAR(20) DEFAULT NULL,
  CM_Updated_At DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (CM_Payment_ID),
  INDEX idx_payment_lead (CM_Lead_ID),
  INDEX idx_payment_date (CM_Payment_Date),
  INDEX idx_payment_status (CM_Payment_Status),
  INDEX idx_payment_deleted (CM_Is_Deleted),
  CONSTRAINT fk_payment_lead FOREIGN KEY (CM_Lead_ID) REFERENCES ccms_sales_lead(CM_Lead_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SALES PROJECT CONVERSION TABLE
CREATE TABLE IF NOT EXISTS ccms_sales_project_conversion (
  CM_Conversion_ID VARCHAR(20) NOT NULL,
  CM_Lead_ID VARCHAR(20) NOT NULL,
  CM_Project_ID VARCHAR(20) DEFAULT NULL,
  CM_Converted_By VARCHAR(20) DEFAULT NULL,
  CM_Converted_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  CM_Remarks TEXT DEFAULT NULL,
  CM_Is_Deleted TINYINT(1) DEFAULT 0,
  CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CM_Conversion_ID),
  INDEX idx_conv_lead (CM_Lead_ID),
  INDEX idx_conv_project (CM_Project_ID),
  CONSTRAINT fk_conv_lead FOREIGN KEY (CM_Lead_ID) REFERENCES ccms_sales_lead(CM_Lead_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SALES ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS ccms_sales_activity_log (
  CM_Log_ID VARCHAR(20) NOT NULL,
  CM_Lead_ID VARCHAR(20) DEFAULT NULL,
  CM_Action VARCHAR(100) NOT NULL,
  CM_Description TEXT DEFAULT NULL,
  CM_Performed_By VARCHAR(20) DEFAULT NULL,
  CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CM_Log_ID),
  INDEX idx_log_lead (CM_Lead_ID),
  INDEX idx_log_date (CM_Created_At)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- TRIGGERS FOR AUTO ID GENERATION
-- =====================================================

DELIMITER $$

-- Sales Lead ID Trigger
DROP TRIGGER IF EXISTS trg_bi_ccms_sales_lead$$
CREATE TRIGGER trg_bi_ccms_sales_lead
BEFORE INSERT ON ccms_sales_lead
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Lead_ID IS NULL OR NEW.CM_Lead_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Lead_ID, 5) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_sales_lead;
        SET NEW.CM_Lead_ID = CONCAT('LED', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- Sales Visit ID Trigger
DROP TRIGGER IF EXISTS trg_bi_ccms_sales_visit$$
CREATE TRIGGER trg_bi_ccms_sales_visit
BEFORE INSERT ON ccms_sales_visit
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Visit_ID IS NULL OR NEW.CM_Visit_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Visit_ID, 5) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_sales_visit;
        SET NEW.CM_Visit_ID = CONCAT('VST', LPAD(last_id + 1, 6, '0'));
    END IF;
    -- Auto-increment visit count for this lead
    IF NEW.CM_Visit_Count IS NULL OR NEW.CM_Visit_Count = 0 THEN
        SELECT IFNULL(COUNT(*), 0) + 1
        INTO NEW.CM_Visit_Count
        FROM ccms_sales_visit
        WHERE CM_Lead_ID = NEW.CM_Lead_ID AND CM_Is_Deleted = 0;
    END IF;
END$$

-- Sales Payment ID Trigger
DROP TRIGGER IF EXISTS trg_bi_ccms_sales_payment$$
CREATE TRIGGER trg_bi_ccms_sales_payment
BEFORE INSERT ON ccms_sales_payment
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Payment_ID IS NULL OR NEW.CM_Payment_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Payment_ID, 5) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_sales_payment;
        SET NEW.CM_Payment_ID = CONCAT('SPY', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- Sales Conversion ID Trigger
DROP TRIGGER IF EXISTS trg_bi_ccms_sales_project_conversion$$
CREATE TRIGGER trg_bi_ccms_sales_project_conversion
BEFORE INSERT ON ccms_sales_project_conversion
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Conversion_ID IS NULL OR NEW.CM_Conversion_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Conversion_ID, 5) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_sales_project_conversion;
        SET NEW.CM_Conversion_ID = CONCAT('CNV', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- Activity Log ID Trigger
DROP TRIGGER IF EXISTS trg_bi_ccms_sales_activity_log$$
CREATE TRIGGER trg_bi_ccms_sales_activity_log
BEFORE INSERT ON ccms_sales_activity_log
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Log_ID IS NULL OR NEW.CM_Log_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Log_ID, 5) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_sales_activity_log;
        SET NEW.CM_Log_ID = CONCAT('LOG', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

DELIMITER ;


-- =====================================================
-- NAV LINKS FOR CRM MODULE  
-- Insert into ccms_nav_link for the sidebar navigation
-- =====================================================
INSERT INTO ccms_nav_link (CM_Nav_Link_ID, CM_Name, CM_Path, CM_Section) VALUES
(NULL, 'Sales Dashboard', '/dashboard/crm', 'CRM'),
(NULL, 'Sales Leads', '/dashboard/crm/leads', 'CRM'),
(NULL, 'Visit Tracking', '/dashboard/crm/visits', 'CRM'),
(NULL, 'Sales Payments', '/dashboard/crm/payments', 'CRM'),
(NULL, 'Sales Reports', '/dashboard/crm/reports', 'CRM');

-- Grant privileges to Admin role (ROL000001) for all CRM nav links
INSERT INTO ccms_privilege_master (CM_ID, CM_Role_ID, CM_Nav_Link_ID)
SELECT NULL, 'ROL000001', CM_Nav_Link_ID 
FROM ccms_nav_link 
WHERE CM_Section = 'CRM';
