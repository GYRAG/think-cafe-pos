import { useState } from 'react';
import { useStore } from '../../store';
import { User } from '../../types';
import { Plus, Edit2, Trash2, X, Shield, User as UserIcon } from 'lucide-react';

export default function UsersPage() {
  // In a real app, users would be stored in the database.
  // For this prototype, we'll just show a static list or manage a local list if we add it to the store.
  // Let's add users to the store to make it functional.
  
  // Since we didn't add users array to the store initially, let's just mock it for the UI
  // or we can just show the current user and a placeholder.
  const currentUser = useStore(state => state.user);
  const showNotification = useStore(state => state.showNotification);
  
  const [users] = useState<User[]>([
    { id: '1', username: 'admin', role: 'admin' },
    { id: '2', username: 'cashier', role: 'cashier' }
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-800">მომხმარებლები</h1>
        <button
          className="flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-stone-800/20"
          onClick={() => showNotification('მომხმარებლის დამატება (დემო ვერსია)', 'error')}
        >
          <Plus className="w-5 h-5" />
          მომხმარებლის დამატება
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">მომხმარებელი</th>
                <th className="p-4 font-medium">როლი</th>
                <th className="p-4 font-medium text-right">ქმედებები</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-stone-800">{user.username}</span>
                      {currentUser?.username === user.username && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full font-medium">თქვენ</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'admin' ? 'ადმინისტრატორი' : 'მოლარე'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="რედაქტირება"
                        onClick={() => showNotification('რედაქტირება (დემო ვერსია)', 'error')}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="წაშლა"
                        disabled={currentUser?.username === user.username}
                        onClick={() => showNotification('წაშლა (დემო ვერსია)', 'error')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
