import React from 'react';
import { useStore } from '../store';
import { CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const notification = useStore(state => state.notification);
  const hideNotification = useStore(state => state.hideNotification);

  if (!notification || !notification.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
          notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {notification.isConfirm ? (
            <Trash2 className="w-8 h-8" />
          ) : notification.type === 'success' ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>

        {/* Text */}
        <h3 className="text-2xl font-black text-stone-800 tracking-tight mb-2">
          {notification.isConfirm ? 'დაბეჯითებით?' : notification.type === 'success' ? 'წარმატებული' : 'ყურადღება'}
        </h3>
        <p className="text-stone-500 font-medium mb-8 text-lg">
          {notification.message}
        </p>
        
        {/* Buttons */}
        {notification.isConfirm ? (
          <div className="flex gap-4 w-full">
            <button
              onClick={hideNotification}
              className="flex-1 py-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors"
            >
              არა
            </button>
            <button
              onClick={() => {
                notification.onConfirm?.();
                hideNotification();
              }}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg"
            >
              დიახ
            </button>
          </div>
        ) : (
          <button
            onClick={hideNotification}
            className={`w-full py-4 text-white rounded-xl font-bold transition-colors shadow-lg ${
              notification.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            დახურვა
          </button>
        )}
      </div>
    </div>
  );
};
