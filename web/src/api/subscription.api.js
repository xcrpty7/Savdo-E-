import api from './axios';

export const getMySubscription = () => api.get('/subscriptions');
export const createPayment = (data) => api.post('/subscriptions/create-payment', data);
export const demoPayment = (data) => api.post('/subscriptions/demo-payment', data);
