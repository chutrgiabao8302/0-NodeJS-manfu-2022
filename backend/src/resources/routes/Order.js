const router = require('express').Router();
const db = require("../../config/db/database");
const { queryString } = require('../middlewares');
const { procedureQueryString } = require('../middlewares/index2');
const { uuid } = require('uuidv4');
const { statusCheckOrder, getOrderStatus, updateStatusOrderCheck, checkExistObject, getStatusBasedOnCategory, increaseOrderPriority } = require("../middlewares/function-phu");
const moment = require("moment");


// [GET] Get all orders -> /api/orders/get-orders
router.get('/get-orders', async (req, res, next) => {
    await db.CallFunc({
        function: 'FN_REFRESH_ORDER_QUEUE()',
        optional: 'Order by order_priority desc, created_at'
    })
        .then(data => {
            if (data.length != 0) {
                return res.status(200).json({
                    success: true,
                    code: 1,
                    message: "List of orders",
                    counter: data.length,
                    data: data
                })
            }
            else {
                return res.status(404).json({
                    success: true,
                    code: 0,
                    message: "There is no orders!"
                })
            }
        })
        .catch(err => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})


// [GET] Get order based on status -> /api/orders/get-orders/:status
// waiting , preparing , success , cancel
router.get('/get-orders/status/:status', async (req, res, next) => {
    const { status } = req.params
    if (statusCheckOrder(status) == false) {
        return res.status(404).json({
            success: false,
            message: `No products with status ${status} found`
        })
    }
    await db.CallFunc({
        function: `FN_REFRESH_ORDER_QUEUE()`,
        optional: `WHERE order_status = '${status}' ORDER BY order_priority desc, created_at asc`
    })
        .then((data) => {
            if (data.length == 0) {
                return res.status(300).json({
                    success: true,
                    code: 0,
                    message: `No data found for status ${status}!`
                })
            }
            else {
                return res.status(200).json({
                    success: true,
                    code: 1,
                    message: `Data found for status ${status}!`,
                    counter: data.length,
                    data: data
                })
            }
        })
        .catch((err) => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})


// [GET] Get orders for chefs (include only waiting and preparing) -> /api/orders/get-orders/:status
router.get("/get-orders/chef", async (req, res, next) => {
    await db.CallFunc({
        function: `FN_REFRESH_ORDER_QUEUE()`,
        optional: `ORDER BY order_priority desc, created_at asc`
    })
        .then((data) => {
            if (data.length == 0) {
                return res.status(300).json({
                    success: false,
                    code: 0,
                    message: `No Order(s) for 'waiting' and 'preparing' status!`
                })
            }
            else {
                return res.status(200).json({
                    success: true,
                    code: 1,
                    counter: data.length,
                    message: `There are ${data.length} for 'waiting' and 'preparing' order(s)!`,
                    data: data
                })
            }
        })
        .catch((err) => { return res.status(500).json({ success: false, message: err }) })
})


// [GET] Get order info based on order ID -> /api/orders/get-orders/id/:oid
router.get("/get-orders/id/:oid", async (req, res, next) => {
    const { oid } = req.params
    await db.CallFunc({
        function: `FN_REFRESH_ORDER_QUEUE()`,
        optional: `WHERE order_ID = '${oid}'`
    })
        .then((data) => {
            if (data.length == 0) {
                return res.status(300).json({
                    success: true,
                    code: 0,
                    message: `No order info for ${oid}!`
                })
            }
            else {
                return res.status(200).json({
                    success: true,
                    code: 1,
                    message: `Data for order ${oid} found!`,
                    data: data
                })
            }
        })
        .catch((err) => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})

router.get('/get-orders-by-bill/:bill_ID', async (req, res, next) => {
    const { bill_ID } = req.params;

    await db.CallFunc({
        function: `FN_GET_ORDERING_BY_BILL ('${bill_ID}')`,
        optional: 'order by created_at desc'
    })
    .then(data => {
        if (data.length != 0) {
            let total = 0;
            let orders = data.map(d => {
                total += d.price * d.quantity;
                return {
                    order_ID: d.order_ID,
                    pid: d.product_ID,
                    pname: d.product_name,
                    price: d.price,
                    quantity: d.quantity,
                    status: d.order_status,
                    created_at: d.created_at
                }
            })
            return res.status(200).json({success: true, data: {orders, total}});
        };
        
        return res.status(404).json({success: false, msg: 'Không tìm thấy order nào'});
    })
    .catch(err => {
        return res.status(500).json({success: false, err})
    })
})


// [PUT] Update order -> /api/orders/update/:oid
router.put("/update/:oid", async (req, res, next) => {
    const { oid } = req.params
    const { created_at, product_ID, price, quantity, order_status, order_priority, table_ID, bill_ID } = req.body
    let date = moment(created_at).format('YYYY-MM-DD HH:mm:ss')
    let order = await checkExistObject('FN_REFRESH_ORDER_QUEUE()', `WHERE order_ID = '${oid}'`)
    if (order.success == false) {
        return res.status(404).json({ success: false, code: 0, message: `${oid} does not exist!` })
    }
    await db.ExecProc({
        procedure: `PROC_UPDATE_ORDER '${oid}', '${date}', '${product_ID}', ${price}, ${quantity}, '${order_status}', ${order_priority}, '${table_ID}', '${bill_ID}'`
    })
        .then(() => {
            return res.status(200).json({
                success: true,
                code: 1,
                message: `${oid} updated at ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
                time: new Date()
            })
        })
        .catch((err) => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})


// [PUT] Update order status -> /api/orders/update-status/:oid
// waiting -> preparing -> success
// waiting -> cancel
router.put('/update-status/:oid', async (req, res, next) => {
    const { oid } = req.params
    const { status } = req.body
    let result = await updateStatusOrderCheck(status, oid)

    if (result.success == true) {
        await db.ExecProc({
            procedure: `PROC_SWITCH_STATUS_ORDER '${oid}', '${status}'`
        })
            .then(() => {
                return res.status(200).json({
                    success: true,
                    code: 1,
                    message: `Order: ${oid} switch status to ${status} successfully!`
                })
            })
            .catch((err) => {
                return res.status(500).json({
                    success: false,
                    message: err
                })
            })
    }
    else {
        return res.status(300).json({
            success: false,
            message: result.message
        })
    }
})


// [POST] Create order -> /api/orders/create-order/
router.post('/create-order', async (req, res, next) => {
    const { table_ID, bill_ID, data } = req.body // data = product_ID, quantity
    let message = ''
    // bill_ID -> check bill exist and bill status -> get billID and tableID
    let bill = await checkExistObject('FN_VIEW_BILL()', `WHERE bill_ID = '${bill_ID}'`)
    if (!bill.data) {
        message = `${bill_ID} does not exist!`
        return res.status(500).json({ success: false, message: message })
    }
    if (bill.data.is_completed) {
        message = `${bill_ID} is completed!`
        return res.status(500).json({ success: false, message: message })
    }
    let table = await checkExistObject('FN_GET_ALL_TABLE()', `WHERE table_ID = '${table_ID}'`)
    if (!table.data) {
        message = `${table_ID} does not exist!`
        return res.status(500).json({ success: false, message: message })
    }
    if (table.data.is_available) {
        message = `${table_ID} is not opened yet! It does not have any people sitting there`
        return res.status(500).json({ success: false, message: message })
    }
    if (bill.data.table_ID != table.data.table_ID) {
        message = `${table_ID} does not match table_ID from ${bill_ID}!`
        return res.status(500).json({ success: false, message: message })
    }

    if (!data) {
        return res.status(300).json({success: false, message: 'Vui lòng chọn món trước khi order'});
    }
    let isSuccess = true;
    
    if (bill.success == true) {
        data.forEach(async element => {
            // product_ID -> check product exists -> order priority and price
            let product = await checkExistObject('FN_VIEW_PRODUCT_STORAGE()', `WHERE product_ID = '${element.product_ID}'`)
            
            if (product.success == true) {
                let product_ID = product.data.product_ID
                let price = product.data.product_price
                let quantity = element.quantity
                let order_status = getStatusBasedOnCategory(product.data.product_category)
                let order_priority = product.data.product_priority
                let table_ID = bill.data.table_ID
                let bill_ID = bill.data.bill_ID
                if (order_status != 'success') {
                    increaseOrderPriority('PROC_INCREASE_ORDER_PRIORITY')
                }
                let order_id = "OR" + uuid().substring(0, 8)
                // console.log("true")
                await db.ExecProc({
                    procedure: `PROC_INSERT_ORDER '${order_id}', '${product_ID}', ${price}, ${quantity}, '${order_status}', ${order_priority}, '${table_ID}', '${bill_ID}'`
                })
                    .then(() => {
                        
                    })
                    .catch((err) => {
                        console.log(err)
                        isSuccess = false;
                        return;
                    })
            }
            // if product does not exist then we do not save it in
        })

        if (isSuccess) {
            return res.status(200).json({
                success: true, code: 1, bill_ID, message: `Order for Bill: ${bill_ID} was created at ${moment().format('YYYY-MM-DD HH:mm:ss')}`
            })
    
        } else {
            return res.status(500).json({ success: false, message: err })
        }
    }
    else {
        return res.status(404).json({ success: false, message: `The Bill: ${bill_ID} is does not exist and cannot create orders!` })
    }
})


module.exports = router
