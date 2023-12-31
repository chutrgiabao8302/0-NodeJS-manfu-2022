﻿create database manfu
drop database manfu
use manfu

-----------------------------------------------------------

create table __PRODUCT (
	product_ID varchar(10),
	product_name nvarchar(255) not null,
	product_category varchar(10) check (product_category in ('buffet', 'alacarte', 'ticket', 'extra')),
	product_price int,
	product_priority int,
	is_available bit, --1 is true and 0 is false
	image_link varchar(255)

	constraint PK_FOOD primary key (product_ID)
)

create table __STAFF(
	staff_ID varchar(10),
	staff_name nvarchar(255),
	
	join_date datetime,
	roles varchar(255) check (roles in ('chef', 'staff', 'manager', 'admin')),
	image_link varchar(255) null,
	
	is_available BIT,
	constraint PK_STAFF primary key (staff_ID)
)

create table __ACCOUNT(
	account_ID varchar(10) Primary key,
	account_password varchar(10),
	is_available bit,
	staff_ID varchar(10),

	constraint FK_ACCOUNT_STAFF foreign key (staff_ID) references __STAFF(staff_ID)
)

create table __TABLE (
	table_ID varchar(10),
	table_seat int,
	is_available bit,
	--bill_ID varchar(10),
	staff_ID varchar(10),

	constraint PK_TABLE primary key (table_ID),
	--constraint FK_TABLE_BILL foreign key (bill_ID) references __BILL(bill_ID),
	--constraint FK_TABLE_STAFF foreign key (staff_ID) references __STAFF(staff_ID)
)

create table __BILL(
	bill_ID varchar(10),
	total_price int,
	created_at datetime,
	table_ID varchar(10),

	constraint PK_BILL primary key (bill_ID),
	constraint FK_BILL_TABLE foreign key (table_ID) references __TABLE(table_ID)
)

create table __ORDER (
	order_ID varchar(10),
	created_at datetime,
	updated_at datetime,
	table_ID varchar(10),
	bill_ID varchar(10), -- NO FK 

	constraint PK_ORDER primary key (order_ID),
	constraint FK_ORDER_TABLE foreign key (table_ID) references __TABLE(table_ID)
)

create table __ORDER_DETAIL (
	order_ID varchar(10),
	product_ID varchar(10),
	quantity int,
	price int,
	product_status varchar(10) check (product_status in ('success', 'cancel', 'idle')),
	product_priority int,

	constraint PK_ORDER_DETAIL primary key (product_ID, order_ID),
	constraint FK_ORDER_DETAIL_PRODUCT foreign key (product_ID) references __PRODUCT(product_ID),
	constraint FK_ORDER_DETAIL_ORDER foreign key (order_ID) references __ORDER(order_ID)
)

-----------------------------------------------------------

--ticket_priority = 10, extra_priority = 9, vegatable_priority = 8
--buffet_priority = 7-5, alacarte_priority = 4-2
--so 1-0 are extra
insert into __PRODUCT (product_ID, product_name, product_category, product_price, product_priority, is_available, image_link) 
values ('TK00000001', N'ticket buffet lẩu','ticket', 500000, 10, 1, null)
insert into __PRODUCT values ('EX00000001', N'khăn lạnh', 'extra',5000, 9, 1, null)
insert into __PRODUCT values ('FD00000001', N'bò tái','buffet', 50000, 5, 1, null)
insert into __PRODUCT values ('AL00000001', N'bò xào ngũ vị', 'alacarte', 75000, 4, 1, null)
insert into __PRODUCT values ('AL00000002', N'bò xào tam vị', 'alacarte', 35000, 3, 0, null)
select * from __PRODUCT

--

insert into __STAFF (staff_ID, staff_name, join_date, roles, is_available) 
values ('EMP0000001', N'Nguyên Văn A', getdate(), 'admin', 1)
insert into __STAFF values ('EMP0000002', N'Nguyên Văn B', getdate(), 'manager', null, 1)
insert into __STAFF values ('EMP0000003', N'Nguyên Văn C', getdate(), 'staff', null, 1)
insert into __STAFF values ('EMP0000004', N'Nguyên Văn D', getdate(), 'chef', null, 0)
insert into __STAFF values ('EMP0000005', N'Nguyên Văn E', getdate(), 'chef', null, 1)
select * from __STAFF

--

insert into __ACCOUNT (account_ID, account_password, is_available, staff_ID)
values ('AC00000001', '123456', 1, 'EMP0000001')
insert into __ACCOUNT values ('AC00000002', '123456', 0, 'EMP0000002')
--delete from __ACCOUNT

--

--delete from __TABLE
insert into __TABLE (table_ID, table_seat, is_available, staff_ID) 
values ('TAB0000001', 4, 0, 'EMP0000003')
insert into __TABLE values ('TAB0000002', 8, 1, null)
insert into __TABLE values ('TAB0000003', 10, 1, null)
select * from __TABLE
--delete from __TABLE where table_ID = 'TAB0000004'
select * from __TABLE where staff_ID is NULL

--

-- not yet
--insert into __BILL (bill_ID, total_price, created_at, table_id) 
--values ('BIL0000001', 0, GETDATE(), 'TAB0000001')
--insert into __BILL values ('BIL0000002', 0, GETDATE(), 'TAB0000002')
--insert into __BILL values ('BIL0000003', 0, GETDATE(), 'TAB0000003')

--

--delete from __ORDER
insert into __ORDER (order_ID, created_at, updated_at, table_ID, bill_ID) 
values ('OR00000001', GETDATE(), null, 'TAB0000001', null)
insert into __ORDER values ('OR00000002', GETDATE(), null, 'TAB0000001', null)
insert into __ORDER values ('OR00000003', GETDATE(), null, 'TAB0000001', null)
select * from __ORDER
--delete from __ORDER where order_ID = 'ORe28be452'

--

--delete from __ORDER_DETAIL
insert into __ORDER_DETAIL (order_ID, product_ID, quantity, price, product_status, product_priority) 
values ('OR00000001', 'AL00000001', 5, 75000, 'idle', 4)
insert into __ORDER_DETAIL values ('OR00000001', 'TK00000001', 1, 500000, 'success', 10)

insert into __ORDER_DETAIL values ('OR00000002', 'TK00000001', 2, 500000, 'success', 10)
insert into __ORDER_DETAIL values ('OR00000002', 'AL00000001', 5, 75000, 'idle', 4)
insert into __ORDER_DETAIL values ('OR00000002', 'FD00000001', 5, 75000, 'idle', 5)

insert into __ORDER_DETAIL values ('OR00000003', 'TK00000001', 3, 500000, 'success', 10)
insert into __ORDER_DETAIL values ('OR00000003', 'FD00000001', 5, 75000, 'idle', 6)
insert into __ORDER_DETAIL values ('OR00000003', 'EX00000001', 5, 75000, 'idle', 9)
select * from __ORDER_DETAIL
--update __ORDER_DETAIL set product_status = 'idle' where order_ID = 'OR00000002' and product_ID = 'AL00000001'
--update __ORDER_DETAIL set product_status = 'idle' where order_ID = 'OR00000002' and product_ID = ''
--delete from __ORDER_DETAIL where order_ID = 'ORe28be452'

-----------------------------------------------------------
--procedure to increate the priority
select * from __ORDER_DETAIL

go
--drop proc increaseOrderDetailPriority
CREATE PROCEDURE increaseOrderDetailPriority
AS
update __ORDER_DETAIL 
set product_priority = product_priority + 1
where product_status != 'success' and product_status != 'cancel'
GO;
--exec increaseOrderDetailPriority


go
--drop proc decreaseOrderDetailPriority
CREATE PROCEDURE decreaseOrderDetailPriority
AS
update __ORDER_DETAIL 
set product_priority = product_priority - 1
where product_status != 'success' and product_status != 'cancel'
go
--exec decreaseOrderDetailPriority

-----------------------------------------------------------

--drop trigger TABLE_BILL_HANDLER
go
create trigger TABLE_BILL_HANDLER 
on __BILL
for insert
as 
begin
	declare @table_id_inserted varchar(10)
	declare @available int
	
	select @table_id_inserted = table_id from inserted
	select @available = __TABLE.is_available from __TABLE where __TABLE.table_ID = @table_id_inserted
	if(@available = 1)
	begin
		print N'BÀN KHÔNG CÓ NGƯỜI, KHÔNG TẠO ĐƯỢC BILL'
		rollback tran
	end
end

-- list all triggers
SELECT  
    name,
    is_instead_of_trigger
FROM 
    sys.triggers  
WHERE 
    type = 'TR';

-----------------------------------------------------------

-- for the chefs
select  OD.*, O.table_ID, O.created_at
from __ORDER_DETAIL OD, __ORDER O
where O.order_ID = OD.order_ID 
	and OD.product_status = 'idle'
order by OD.product_priority desc, O.created_at asc

-----------------------------------------------------------

--cancel all order when create bill
--should add the comment section on each order

-----------------------------------------------------------
select * 
from __ORDER O
where O.table_ID = 'TAB0000001' and O.bill_ID is null       

insert into __ORDER values ('OR00000000', GETDATE(), null, 'TAB0000002', null)
insert into __ORDER_DETAIL values ('OR00000000', 'EX00000001', 5, 75000, 'idle', 9)
select *
from __ORDER O, __ORDER_DETAIL OD
where O.order_ID = OD.order_ID and O.order_ID = 'OR00000000'

--important
update 
	table_a
set
	table_a.product_status = 'cancel'
from
	__ORDER_DETAIL as table_a
	inner join (select *
				from __ORDER O
				where O.table_ID = 'TAB0000001') as table_b
		on table_a.order_ID = table_b.order_ID
where table_a.product_status = 'idle'


--important
select OD.*, P.product_category
from __ORDER O, __ORDER_DETAIL OD, __PRODUCT P
where O.order_ID = OD.order_ID
	and OD.product_ID = P.product_ID
	and O.table_ID = 'TAB0000001'


--update __ORDER_DETAIL
--set product_status = 'success'
--where exists
--(
--	select OD.*
--	from __ORDER_DETAIL OD
--	where exists(
--		select *
--		from __ORDER O
--		where O.table_ID = 'TAB0000001' --and O.bill_ID = ''
--			and O.order_ID = OD.order_ID
--			and OD.product_status = 'idle'
--	)
--)
select * from __ORDER_DETAIL
update __ORDER_DETAIL 
set product_status = 'idle'
update __ORDER_DETAIL 
set product_status = 'success'
where product_ID = 'TK00000001'
update __ORDER_DETAIL
set product_status = 'success'
where order_ID = 'OR00000003' and product_ID = 'EX00000001'


select * from __ORDER
update __ORDER
set bill_ID = NULL
where bill_ID = 'Bebf95532-'


select * from __BILL
delete from __BILL

select * from __TABLE
update __TABLE
set is_available = 0
where table_ID = 'TAB0000001'

--insert into __BILL values ('BIL0000004', 0, GETDATE(), 'TAB0000001')

--select t1.order_ID, t2.product_ID, t2.quantity, t2.price, t2.product_status, t2.product_priority, t1.created_at 
--from (
--	Select order_ID, O.created_at 
--	From __ORDER O, __TABLE T, __BILL B 
--	Where O.table_ID = T.table_ID AND B.table_ID = T.table_ID AND B.bill_ID = 'BIL0000001'
--) t1 
--inner join
--(
--	select * 
--	from __ORDER_DETAIL
--) t2
--ON t1.order_ID = t2.order_ID
--order by t1.order_ID asc

--alter table __PRODUCT
--ADD image_link varchar(255)
--select * from __PRODUCT

--update __STAFF
--set password = '$2a$10$BG7NfEFw9jA8jG9GvPTtxu/6HJU51xWLB27U8PivXjbY4hbtiVYzG'

--drop database manfu