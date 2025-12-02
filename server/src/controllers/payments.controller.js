const axios = require('axios');
const crypto = require('crypto');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

const modelUser = require('../models/users.model');
const modelRechargeUser = require('../models/RechargeUser.model');

const { v4: uuidv4 } = require('uuid');

class PaymentsController {
    async payments(req, res) {
        const { id } = req.user;
        const { typePayment, amountUser } = req.body;

        if (!typePayment) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        if (typePayment === 'MOMO') {
            var partnerCode = 'MOMO';
            var accessKey = 'F8BBA842ECF85';
            var secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = `nap tien ${id}`; // nội dung giao dịch thanh toán
            var redirectUrl = `${import.meta.env.VITE_SOCKET_URL}/api/check-payment-momo`; // 8080
            var ipnUrl = `${import.meta.env.VITE_SOCKET_URL}/api/check-payment-momo`;
            var amount = amountUser;
            var requestType = 'captureWallet';
            var extraData = ''; //pass empty value if your merchant does not have stores

            var rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;
            //puts raw signature

            //signature
            var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'en',
            });

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            new OK({ message: 'Thanh toán thông báo', metadata: response.data }).send(res);
        }
        if (typePayment === 'VNPAY') {
            const vnpay = new VNPay({
                tmnCode: 'YTECNE3W',
                secureSecret: 'JVZXMY2QN6PHINPS1RXA2EKEQM1WOW7F',
                vnpayHost: 'https://sandbox.vnpayment.vn',
                testMode: true, // tùy chọn
                hashAlgorithm: 'SHA512', // tùy chọn
                loggerFn: ignoreLogger, // tùy chọn
            });
            const uuid = uuidv4();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const vnpayResponse = await vnpay.buildPaymentUrl({
                // VNPAY expects amount in smallest currency unit (x100), so multiply by 100
                vnp_Amount: Number(amountUser) * 100, // amountUser is in VND
                vnp_IpAddr: '127.0.0.1', //
                vnp_TxnRef: `${id}-${uuid}`,
                vnp_OrderInfo: `nap tien ${id}`,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: `${import.meta.env.VITE_SOCKET_URL}/api/check-payment-vnpay`, //
                vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
                vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
                vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
                vnp_BankCode: 'NCB', // tùy chọn
            });
            new OK({ message: 'Thanh toán thông báo', metadata: vnpayResponse }).send(res);
        }
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode, amount } = req.query;

        if (resultCode === '0') {
            const result = orderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });
            if (findUser) {
                // amount from MoMo should be numeric string
                const realAmount = Number(amount);
                findUser.balance += realAmount;
                await findUser.save();

                // Always record the recharge regardless of socket connection
                await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: realAmount,
                    typePayment: 'MOMO',
                    status: 'success',
                });

                // Emit socket event if user is connected
                const socket = global.usersMap.get(findUser._id.toString());
                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: realAmount,
                        date: new Date(),
                        typePayment: 'MOMO',
                    });
                }

                // Redirect back to frontend regardless
                return res.redirect(`http://localhost:5173/trang-ca-nhan`);
            }
        }
        // If not success or user not found, redirect back to frontend with failure info
        return res.redirect(`http://localhost:5173/trang-ca-nhan`);
    }

    async checkPaymentVnpay(req, res) {
        const { vnp_ResponseCode, vnp_OrderInfo, vnp_Amount } = req.query;

        if (vnp_ResponseCode === '00') {
            const result = vnp_OrderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });
            if (findUser) {
                // vnp_Amount is returned in smallest unit (amount*100), convert back to VND
                const received = Number(vnp_Amount);
                const realAmount = Number.isFinite(received) ? received / 100 : 0;

                findUser.balance += realAmount;
                await findUser.save();

                // Always record the recharge
                await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: realAmount,
                    typePayment: 'VNPAY',
                    status: 'success',
                });

                // Emit socket event if user is connected
                const socket = global.usersMap.get(findUser._id.toString());
                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: realAmount,
                        date: new Date(),
                        typePayment: 'VNPAY',
                    });
                }

                return res.redirect(`http://localhost:5173/trang-ca-nhan`);
            }
        }

        // On failure or unknown, redirect back to frontend
        return res.redirect(`http://localhost:5173/trang-ca-nhan`);
    }
}
module.exports = new PaymentsController();
