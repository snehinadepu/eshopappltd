import React from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { orderCreate } from '../action/orderAction';
import { useHistory } from 'react-router-dom';

const RazorpayButton = ({ price }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const cart = useSelector(state => state.cart);

  const loadRazorpay = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");

    if (!res) {
      alert("Failed to load Razorpay SDK");
      return;
    }

    try {
      const { data } = await axios.post('/api/payment/create-order', {
        amount: price * 100, // in paisa
      });

      const { id: order_id, amount, currency } = data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "LBWF Electronic Ltd.",
        description: "Order Payment",
        order_id,
        handler: async function (response) {
          // You should verify payment here before dispatching orderCreate
          try {
            // Call your backend verify payment API
            const verifyRes = await axios.post('/api/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.status === 'success') {
              // Payment verified successfully, now create the order
              dispatch(orderCreate({ ...cart, orderItems: cart.cartItems }));
              history.push("/success");
            } else {
              alert('Payment verification failed!');
            }
          } catch (err) {
            alert('Payment verification error!');
            console.error(err);
          }
        },
        prefill: {
          name: cart.shippingAddress.fullName,
          contact: cart.shippingAddress.cellPhone,
          email: "customer@example.com",
        },
        theme: {
          color: "#528FF0"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };


  return (
    <button className='btn btn-primary btn-block' onClick={handlePayment}>
      Pay with Razorpay
    </button>
  );
};

export default RazorpayButton;
