DELIMITER $$

-- 1. ccms_attendance
CREATE TRIGGER trg_bi_ccms_attendance
BEFORE INSERT ON ccms_attendance
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Attendance_ID IS NULL OR NEW.CM_Attendance_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Attendance_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_attendance;
        SET NEW.CM_Attendance_ID = CONCAT('ATT', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 2. ccms_category
CREATE TRIGGER trg_bi_ccms_category
BEFORE INSERT ON ccms_category
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Category_ID IS NULL OR NEW.CM_Category_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Category_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_category;
        SET NEW.CM_Category_ID = CONCAT('CAT', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 3. ccms_companies
CREATE TRIGGER trg_bi_ccms_companies
BEFORE INSERT ON ccms_companies
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Company_ID IS NULL OR NEW.CM_Company_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Company_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_companies;
        SET NEW.CM_Company_ID = CONCAT('COM', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 4. ccms_customer
CREATE TRIGGER trg_bi_ccms_customer
BEFORE INSERT ON ccms_customer
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Customer_ID IS NULL OR NEW.CM_Customer_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Customer_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_customer;
        SET NEW.CM_Customer_ID = CONCAT('CUS', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 5. ccms_godown
CREATE TRIGGER trg_bi_ccms_godown
BEFORE INSERT ON ccms_godown
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Godown_ID IS NULL OR NEW.CM_Godown_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Godown_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_godown;
        SET NEW.CM_Godown_ID = CONCAT('GOD', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 6. ccms_brand
CREATE TRIGGER trg_bi_ccms_brand
BEFORE INSERT ON ccms_brand
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Brand_ID IS NULL OR NEW.CM_Brand_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Brand_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_brand;
        SET NEW.CM_Brand_ID = CONCAT('BRD', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 7. ccms_budget_entry
CREATE TRIGGER trg_bi_ccms_budget_entry
BEFORE INSERT ON ccms_budget_entry
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Budget_ID IS NULL OR NEW.CM_Budget_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Budget_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_budget_entry;
        SET NEW.CM_Budget_ID = CONCAT('BUD', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 8. ccms_customer_payment
CREATE TRIGGER trg_bi_ccms_customer_payment
BEFORE INSERT ON ccms_customer_payment
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Payment_ID IS NULL OR NEW.CM_Payment_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Payment_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_customer_payment;
        SET NEW.CM_Payment_ID = CONCAT('PAY', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 9. ccms_daily_consumption
CREATE TRIGGER trg_bi_ccms_daily_consumption
BEFORE INSERT ON ccms_daily_consumption
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Consumption_ID IS NULL OR NEW.CM_Consumption_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Consumption_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_daily_consumption;
        SET NEW.CM_Consumption_ID = CONCAT('COSP', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 10. ccms_expenses_entry
CREATE TRIGGER trg_bi_ccms_expenses_entry
BEFORE INSERT ON ccms_expenses_entry
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Expense_ID IS NULL OR NEW.CM_Expense_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Expense_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_expenses_entry;
        SET NEW.CM_Expense_ID = CONCAT('EXP', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 11. ccms_godown_stock_batches
CREATE TRIGGER trg_bi_ccms_godown_stock_batches
BEFORE INSERT ON ccms_godown_stock_batches
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Batch_ID IS NULL OR NEW.CM_Batch_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Batch_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_godown_stock_batches;
        SET NEW.CM_Batch_ID = CONCAT('BATCH', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 12. ccms_godown_transfer
CREATE TRIGGER trg_bi_ccms_godown_transfer
BEFORE INSERT ON ccms_godown_transfer
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Transfer_ID IS NULL OR NEW.CM_Transfer_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Transfer_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_godown_transfer;
        SET NEW.CM_Transfer_ID = CONCAT('TRS', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 13. ccms_item_master
CREATE TRIGGER trg_bi_ccms_item_master
BEFORE INSERT ON ccms_item_master
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Item_ID IS NULL OR NEW.CM_Item_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Item_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_item_master;
        SET NEW.CM_Item_ID = CONCAT('ITM', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 14. ccms_labor
CREATE TRIGGER trg_bi_ccms_labor
BEFORE INSERT ON ccms_labor
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Labor_Type_ID IS NULL OR NEW.CM_Labor_Type_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Labor_Type_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_labor;
        SET NEW.CM_Labor_Type_ID = CONCAT('LAB', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 15. ccms_labor_logs
CREATE TRIGGER trg_bi_ccms_labor_logs
BEFORE INSERT ON ccms_labor_logs
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Labor_Log_ID IS NULL OR NEW.CM_Labor_Log_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Labor_Log_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_labor_logs;
        SET NEW.CM_Labor_Log_ID = CONCAT('LABLOG', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 16. ccms_milestone
CREATE TRIGGER trg_bi_ccms_milestone
BEFORE INSERT ON ccms_milestone
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Milestone_ID IS NULL OR NEW.CM_Milestone_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Milestone_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_milestone;
        SET NEW.CM_Milestone_ID = CONCAT('MILE', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 17. ccms_nav_link
CREATE TRIGGER trg_bi_ccms_nav_link
BEFORE INSERT ON ccms_nav_link
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Nav_Link_ID IS NULL OR NEW.CM_Nav_Link_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Nav_Link_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_nav_link;
        SET NEW.CM_Nav_Link_ID = CONCAT('NAV', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 18. ccms_notification_replies
CREATE TRIGGER trg_bi_ccms_notification_replies
BEFORE INSERT ON ccms_notification_replies
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Reply_ID IS NULL OR NEW.CM_Reply_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Reply_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_notification_replies;
        SET NEW.CM_Reply_ID = CONCAT('RPY', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 19. ccms_notifications
CREATE TRIGGER trg_bi_ccms_notifications
BEFORE INSERT ON ccms_notifications
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Notification_ID IS NULL OR NEW.CM_Notification_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Notification_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_notifications;
        SET NEW.CM_Notification_ID = CONCAT('NOT', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 20. ccms_privilege_master
CREATE TRIGGER trg_bi_ccms_privilege_master
BEFORE INSERT ON ccms_privilege_master
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_ID IS NULL OR NEW.CM_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_privilege_master;
        SET NEW.CM_ID = CONCAT('PRV', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 21. ccms_product_allocation_requests
CREATE TRIGGER trg_bi_ccms_product_allocation_requests
BEFORE INSERT ON ccms_product_allocation_requests
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Request_ID IS NULL OR NEW.CM_Request_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Request_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_product_allocation_requests;
        SET NEW.CM_Request_ID = CONCAT('REQ', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 22. ccms_product_transaction
CREATE TRIGGER trg_bi_ccms_product_transaction
BEFORE INSERT ON ccms_product_transaction
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Transaction_ID IS NULL OR NEW.CM_Transaction_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Transaction_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_product_transaction;
        SET NEW.CM_Transaction_ID = CONCAT('TXN', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 23. ccms_project_product_updates
CREATE TRIGGER trg_bi_ccms_project_product_updates
BEFORE INSERT ON ccms_project_product_updates
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Update_ID IS NULL OR NEW.CM_Update_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Update_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_project_product_updates;
        SET NEW.CM_Update_ID = CONCAT('PPU', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 24. ccms_projects
CREATE TRIGGER trg_bi_ccms_projects
BEFORE INSERT ON ccms_projects
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Project_ID IS NULL OR NEW.CM_Project_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Project_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_projects;
        SET NEW.CM_Project_ID = CONCAT('PRJ', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 25. ccms_purchase
CREATE TRIGGER trg_bi_ccms_purchase
BEFORE INSERT ON ccms_purchase
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Product_ID IS NULL OR NEW.CM_Product_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Product_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_purchase;
        SET NEW.CM_Product_ID = CONCAT('PUR', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 26. ccms_purchase_summary
CREATE TRIGGER trg_bi_ccms_purchase_summary
BEFORE INSERT ON ccms_purchase_summary
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Purchase_Summary_ID IS NULL OR NEW.CM_Purchase_Summary_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Purchase_Summary_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_purchase_summary;
        SET NEW.CM_Purchase_Summary_ID = CONCAT('PURSUM', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 27. ccms_roles_master
CREATE TRIGGER trg_bi_ccms_roles_master
BEFORE INSERT ON ccms_roles_master
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Role_ID IS NULL OR NEW.CM_Role_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Role_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_roles_master;
        SET NEW.CM_Role_ID = CONCAT('ROL', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 28. ccms_solar_estimates
CREATE TRIGGER trg_bi_ccms_solar_estimates
BEFORE INSERT ON ccms_solar_estimates
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_ID IS NULL OR NEW.CM_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_solar_estimates;
        SET NEW.CM_ID = CONCAT('EST', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 29. ccms_subcategory
CREATE TRIGGER trg_bi_ccms_subcategory
BEFORE INSERT ON ccms_subcategory
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Subcategory_ID IS NULL OR NEW.CM_Subcategory_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Subcategory_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_subcategory;
        SET NEW.CM_Subcategory_ID = CONCAT('SUB', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 30. ccms_suppliers
CREATE TRIGGER trg_bi_ccms_suppliers
BEFORE INSERT ON ccms_suppliers
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Supplier_ID IS NULL OR NEW.CM_Supplier_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Supplier_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_suppliers;
        SET NEW.CM_Supplier_ID = CONCAT('SUP', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 31. ccms_task_master
CREATE TRIGGER trg_bi_ccms_task_master
BEFORE INSERT ON ccms_task_master
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Task_ID IS NULL OR NEW.CM_Task_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Task_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_task_master;
        SET NEW.CM_Task_ID = CONCAT('TSK', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 32. ccms_task_update
CREATE TRIGGER trg_bi_ccms_task_update
BEFORE INSERT ON ccms_task_update
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Update_ID IS NULL OR NEW.CM_Update_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Update_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_task_update;
        SET NEW.CM_Update_ID = CONCAT('UPD', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 33. ccms_unit_type
CREATE TRIGGER trg_bi_ccms_unit_type
BEFORE INSERT ON ccms_unit_type
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Unit_ID IS NULL OR NEW.CM_Unit_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Unit_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_unit_type;
        SET NEW.CM_Unit_ID = CONCAT('UNT', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

-- 34. ccms_users
CREATE TRIGGER trg_bi_ccms_users
BEFORE INSERT ON ccms_users
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_User_ID IS NULL OR NEW.CM_User_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_User_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_users;
        SET NEW.CM_User_ID = CONCAT('USR', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- 35. ccms_project_transport
CREATE TRIGGER trg_bi_ccms_project_transport
BEFORE INSERT ON ccms_project_transport
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Transport_ID IS NULL OR NEW.CM_Transport_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Transport_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_project_transport;
        SET NEW.CM_Transport_ID = CONCAT('TRN', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

DELIMITER $$

-- 36. ccms_project_services
CREATE TRIGGER trg_bi_ccms_project_services
BEFORE INSERT ON ccms_project_services
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Service_ID IS NULL OR NEW.CM_Service_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Service_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_project_services;
        SET NEW.CM_Service_ID = CONCAT('SER', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$

DELIMITER $$

-- 37. ccms_incentives
CREATE TRIGGER trg_bi_ccms_incentives
BEFORE INSERT ON ccms_incentives
FOR EACH ROW
BEGIN
    DECLARE last_id INT DEFAULT 0;
    IF NEW.CM_Incentive_ID IS NULL OR NEW.CM_Incentive_ID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(CM_Incentive_ID, 7) AS UNSIGNED)), 0)
        INTO last_id FROM ccms_incentives;
        SET NEW.CM_Incentive_ID = CONCAT('INC', LPAD(last_id + 1, 6, '0'));
    END IF;
END$$