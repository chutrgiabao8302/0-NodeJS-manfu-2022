use manfu


-- VIEW ALL PROCEDURES
-- CURRENTLY 22
-- UPDATED 20/3/2023


--ACCOUNT-3
CREATE PROC PROC_INSERT_ACCOUNT @account_ID varchar(10), @account_password varchar(10), @is_available bit, @staff_ID varchar(10)  
AS   
	INSERT INTO __ACCOUNT   
	VALUES (@account_ID, @account_password, @is_available, @staff_ID)  

CREATE PROC PROC_UPDATE_ACCOUNT @account_ID varchar(10), @account_password varchar(10), @is_available bit, @staff_ID varchar(10)  
AS   
	UPDATE __ACCOUNT   
	SET account_password = @account_password,    
		is_available = @is_available,    
		staff_ID = @staff_ID   
	WHERE account_ID = @account_ID
  
CREATE PROC PROC_SWITCH_STATUS_ACCOUNT @account_ID varchar(10), @is_available bit  
AS   
	UPDATE __ACCOUNT   
	SET is_available = @is_available   
	WHERE account_ID = @account_ID  



--STAFF-3
create proc PROC_INSERT_STAFF @staff_ID varchar(10), @staff_name nvarchar(255), @role varchar(255), @img_link varchar(255), @is_available bit  
as    
	insert into __STAFF    
	values (@staff_ID, @staff_name, GETDATE(), @role, @img_link, @is_available)  

create proc PROC_UPDATE_STAFF @staff_ID varchar(10), @staff_name nvarchar(255), @join_date datetime, @role varchar(255), @img_link varchar(255), @is_available bit  
as   
	update __STAFF    
	set staff_name = @staff_name,    
		join_date = @join_date,    
		role = @role,    
		image_link = @img_link,    
		is_available = @is_available   
	where staff_ID = @staff_ID  

CREATE PROC PROC_SWITCH_STATUS_STAFF @staff_ID varchar(10), @is_available bit  
AS   
	UPDATE __STAFF   
	SET is_available = @is_available   
	WHERE staff_ID = @staff_ID  



--TABLE-4
CREATE PROC PROC_INSERT_TABLE @talbe_ID varchar(10), @table_seat int, @is_available bit  
AS   
	INSERT INTO __TABLE   
	VALUES (@talbe_ID, @table_seaT, @is_available)  

CREATE PROC PROC_UPDATE_TABLE @table_ID varchar(10), @table_seat int, @is_available bit  
AS   
	UPDATE __TABLE   
	SET table_seat = @table_seat,    
		is_available = @is_available   
	WHERE table_ID = @table_ID  
  
CREATE PROC PROC_SWITCH_STATUS_TABLE @table_ID varchar(10), @is_available bit  
AS   
	UPDATE __TABLE   
	SET is_available = @is_available   
	WHERE table_ID = @table_ID  

CREATE PROC PROC_DELETE_TABLE @table_ID varchar(10)  
AS   
	DELETE FROM __TABLE   
	WHERE table_ID = @table_ID  



--BILL-3
CREATE PROC PROC_INSERT_BILL @bill_ID varchar(10), @total_price int, @table_ID varchar(10), @staff_ID varchar(10)  
AS   
	INSERT INTO __BILL   
	VALUES (@bill_ID, @total_price, GETDATE(), 0, @table_ID, @staff_ID)
  
CREATE PROC PROC_UPDATE_BILL @bill_ID varchar(10), @total_price int, @created_at datetime, @is_completed bit, @table_ID varchar(10), @staff_ID varchar(10)  
AS   
	UPDATE __BILL   
	SET total_price = @total_price,    
		created_at = @created_at,    
		table_ID = @table_ID,    
		staff_ID = @staff_ID,    
		is_completed = @is_completed   
	WHERE bill_ID = @bill_ID  

CREATE PROC PROC_SWITCH_STATUS_BILL @bill_ID varchar(10), @is_completed bit, @total_price int  
AS   
	UPDATE __BILL   
	SET is_completed = @is_completed,    
		total_price = @total_price   
	WHERE bill_ID = @bill_ID  



--PRODUCT-4
CREATE PROC PROC_INSERT_PRODUCT @product_ID varchar(10), @product_name nvarchar(255), @product_catery varchar(10), @product_price int, @product_priority int, @is_available bit, @img_link varchar(255)  
AS  
	INSERT INTO __PRODUCT   
 	VALUES (@product_ID, @product_name, @product_catery, @product_price, @product_priority, @is_available, @img_link)
  
CREATE PROC PROC_UPDATE_PRODUCT @product_ID varchar(10), @product_name nvarchar(255), @product_catery varchar(10), @product_price int, @product_priority int, @is_available bit, @img_link varchar(255)  
AS  
	UPDATE __PRODUCT   
	SET product_name = @product_name,    
		product_catery = @product_catery,    
		product_price = @product_price,    
		product_priority = @product_priority,    
		is_available = @is_available,    
		image_link = @img_link   
	WHERE product_ID = @product_ID  

CREATE PROC PROC_SWITCH_STATUS_PRODUCT @product_ID varchar(10), @is_available bit  
AS   
	UPDATE __PRODUCT   
	SET is_available = @is_available   
	WHERE product_ID = @product_ID  

CREATE PROC PROC_DELETE_PRODUCT @product_ID varchar(10)  
AS   
	DELETE FROM __PRODUCT   
	WHERE product_ID = @product_ID  



--ORDER-5
CREATE PROC PROC_INSERT_ORDER @order_ID varchar(10), @product_ID varchar(10), @price int, @quantity int, @order_status varchar(10), @order_priority int, @table_ID varchar(10), @bill_ID varchar(10)  
AS   
	INSERT INTO __ORDER   
	VALUES (@order_ID, GETDATE(), @product_ID, @price, @quantity, @order_status, @order_priority, @table_ID, @bill_ID)  

CREATE PROC PROC_UPDATE_ORDER @order_ID varchar(10), @created_at datetime, @product_ID varchar(10), @price int, @quantity int, @order_status varchar(10), @order_priority int, @table_ID varchar(10), @bill_ID varchar(10)  
AS   
	UPDATE __ORDER   
	SET created_at = @created_at,    
		product_ID = @product_ID,    
		price = @price,    
		quantity = @quantity,    
		order_status = @order_status,    
		order_priority = @order_priority,    
		table_ID = @table_ID,    
		bill_ID = @bill_ID   
	WHERE order_ID = @order_ID  

CREATE PROC PROC_SWITCH_STATUS_ORDER @order_ID varchar(10), @order_status varchar(10)  
AS   
	UPDATE __ORDER   
	SET order_status = @order_status   
	WHERE order_ID = @order_ID  

CREATE PROC PROC_INCREASE_ORDER_PRIORITY   
AS   
	UPDATE __ORDER   
	SET order_priority = order_priority + 1   
	WHERE order_status != 'success' and order_status != 'cancel'  

CREATE PROC PROC_DECREASE_ORDER_PRIORITY   
AS   
	UPDATE __ORDER   
	SET order_priority = order_priority - 1   
	WHERE order_status != 'success' and order_status != 'cancel'  



--VIEW ALL PROCEDURES
SELECT * 
FROM manfu.INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'