const axios = require('axios');
const crypto = require('crypto');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const { BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');

const modelUser = require('../models/users.model');
const modelRechargeUser = require('../models/RechargeUser.model');

const { v4: uuidv4 } = require('uuid');

// ====== ENV BASE URL ======
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ====== ENV MOMO (nên khai trong .env / Railway Variables) ======
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';             // test default
const MOMO_ACCESS_KEY   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85';    // test default
const MOMO_SECRET_KEY   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

// ====== ENV VNPAY ======
const VNP_TMN_CODE     = process.env.VNP_TMN_CODE     || 'YTECNE3W'; // test default
const VNP_HASH_SECRET  = process.env.VNP_HASH_SECRET  || 'JVZXMY2QN6PHINPS1RXA2EKEQM1WOW7F';
const VNP_HOST         = process.env.VNP_HOST         || 'https://sandbox.vnpayment.vn';

class PaymentsController {
    async payments(req, res) {
        const { id } = req.user;
        const { typePayment, amountUser } = req.body;

        if (!typePayment || !amountUser) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        // ====== MOMO ======
        if (typePayment === 'MOMO') {
            const partnerCode = MOMO_PARTNER_CODE;
            const accessKey   = MOMO_ACCESS_KEY;
            const secretkey   = MOMO_SECRET_KEY;

            const requestId = partnerCode + new Date().getTime();
            const orderId   = requestId;
            const orderInfo = `nap tien ${id}`; // nội dung giao dịch thanh toán

            const redirectUrl = `${SERVER_URL}/api/check-payment-momo`;
            const ipnUrl      = `${SERVER_URL}/api/check-payment-momo`;
            const amount      = amountUser;
            const requestType = 'captureWallet';
            const extraData   = ''; // nếu không dùng thì để rỗng

            const rawSignature =
                'accessKey=' + accessKey +
                '&amount=' + amount +
                '&extraData=' + extraData +
                '&ipnUrl=' + ipnUrl +
                '&orderId=' + orderId +
                '&orderInfo=' + orderInfo +
                '&partnerCode=' + partnerCode +
                '&redirectUrl=' + redirectUrl +
                '&requestId=' + requestId +
                '&requestType=' + requestType;

            const signature = crypto
                .createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang: 'en',
            };

            const response = await axios.post(
                'https://test-payment.momo.vn/v2/gateway/api/create',
                requestBody,
                { headers: { 'Content-Type': 'application/json' } }
            );

            return new OK({
                message: 'Thanh toán thông báo',
                metadata: response.data,
            }).send(res);
        }

        // ====== VNPAY ======
        if (typePayment === 'VNPAY') {
            const vnpay = new VNPay({
                tmnCode: VNP_TMN_CODE,
                secureSecret: VNP_HASH_SECRET,
                vnpayHost: VNP_HOST,
                testMode: true,
                hashAlgorithm: 'SHA512',
                loggerFn: ignoreLogger,
            });

            const uuid = uuidv4();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const vnpayResponse = await vnpay.buildPaymentUrl({
                vnp_Amount: Number(amountUser) * 100,
                vnp_IpAddr: '127.0.0.1',
                vnp_TxnRef: `${id}-${uuid}`,
                vnp_OrderInfo: `nap tien ${id}`,
                vnp_OrderType: ProductCode.Other,
                // ✅ Dùng SERVER_URL (backend) chứ không phải import.meta.env
                vnp_ReturnUrl: `${SERVER_URL}/api/check-payment-vnpay`,
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
                vnp_BankCode: 'NCB',
            });

            return new OK({
                message: 'Thanh toán thông báo',
                metadata: vnpayResponse,
            }).send(res);
        }

        // Nếu typePayment không thuộc 2 loại trên
        throw new BadRequestError('Phương thức thanh toán không hợp lệ');
    }

    async checkPaymentMomo(req, res, next) {
        const { orderInfo, resultCode, amount } = req.query;

        if (resultCode === '0') {
            const result = orderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });

            if (findUser) {
                const realAmount = Number(amount);
                findUser.balance += realAmount;
                await findUser.save();

                await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: realAmount,
                    typePayment: 'MOMO',
                    status: 'success',
                });

                const socket = global.usersMap.get(findUser._id.toString());
                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: realAmount,
                        date: new Date(),
                        typePayment: 'MOMO',
                    });
                }

                return res.redirect(`${CLIENT_URL}/trang-ca-nhan`);
            }
        }

        return res.redirect(`${CLIENT_URL}/trang-ca-nhan`);
    }

    async checkPaymentVnpay(req, res) {
        const { vnp_ResponseCode, vnp_OrderInfo, vnp_Amount } = req.query;

        if (vnp_ResponseCode === '00') {
            const result = vnp_OrderInfo.split(' ')[2];
            const findUser = await modelUser.findOne({ _id: result });

            if (findUser) {
                const received   = Number(vnp_Amount);
                const realAmount = Number.isFinite(received) ? received / 100 : 0;

                findUser.balance += realAmount;
                await findUser.save();

                await modelRechargeUser.create({
                    userId: findUser._id,
                    amount: realAmount,
                    typePayment: 'VNPAY',
                    status: 'success',
                });

                const socket = global.usersMap.get(findUser._id.toString());
                if (socket) {
                    socket.emit('new-payment', {
                        userId: findUser._id,
                        amount: realAmount,
                        date: new Date(),
                        typePayment: 'VNPAY',
                    });
                }

                return res.redirect(`${CLIENT_URL}/trang-ca-nhan`);
            }
        }

        return res.redirect(`${CLIENT_URL}/trang-ca-nhan`);
    }
}

module.exports = new PaymentsController();
