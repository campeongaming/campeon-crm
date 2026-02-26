'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';

interface User {
    id: number;
    username: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login?: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'CRM OPS'
    });

    const [users, setUsers] = useState<User[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [fetchError, setFetchError] = useState('');

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            setLoadingUsers(true);
            setFetchError('');
            const response = await axios.get(
                `${API_ENDPOINTS.BASE_URL}/auth/users`,
                { params: { token } }
            );
            setUsers(response.data);
        } catch (error: any) {
            const errMsg = error.response?.data?.detail || error.message || 'Unknown error';
            const status = error.response?.status;
            setFetchError(`Failed to load users (${status ?? 'network error'}): ${errMsg}`);
            console.error('Failed to fetch users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('❌ Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setMessage('❌ Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('auth_token');

            if (!token) {
                setMessage('❌ You must be logged in as admin');
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${API_ENDPOINTS.BASE_URL}/auth/admin/create-user`,
                {
                    username: formData.username,
                    password: formData.password,
                    role: formData.role
                },
                {
                    params: { token }
                }
            );

            setMessage(`✅ User created successfully: ${response.data.username}`);

            // Reset form
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                role: 'CRM OPS'
            });

            // Refresh users list
            fetchUsers();

            setTimeout(() => setMessage(''), 5000);

        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            setDeletingId(userId);
            await axios.delete(
                `${API_ENDPOINTS.BASE_URL}/auth/users/${userId}`,
                { params: { token } }
            );

            setMessage('✅ User deleted successfully');
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);

        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ Error deleting user: ${errorMsg}`);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header with navigation */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-400">User Management</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        ← Back to Main
                    </button>
                </div>

                {/* Create User Section */}
                <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-blue-400 mb-2">Create New User</h2>
                    <p className="text-gray-400 mb-8">Admin Only - Create new team member accounts</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Username <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="firstname.lastname"
                                />
                                <p className="text-sm text-gray-400 mt-1">Format: firstname.lastname</p>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Role <span className="text-red-400">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="CRM OPS">CRM OPS</option>
                                    <option value="Translation Team">Translation Team</option>
                                    <option value="Optimization Team">Optimization Team</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Confirm Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Re-enter password"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`p-4 rounded-lg ${message.includes('✅')
                                ? 'bg-green-900/30 text-green-300 border border-green-700'
                                : 'bg-red-900/30 text-red-300 border border-red-700'
                                }`}>
                                {message}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            {loading ? '⏳ Creating User...' : '✅ Create User'}
                        </button>
                    </form>
                </div>

                {/* Users List Section */}
                <div className="bg-gray-800 rounded-lg shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-blue-400 mb-6">All Users</h2>

                    {loadingUsers ? (
                        <div className="text-center text-gray-400">Loading users...</div>
                    ) : fetchError ? (
                        <div className="text-center text-red-400 text-sm">{fetchError}</div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-gray-400">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-300">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold">Username</th>
                                        <th className="text-left py-3 px-4 font-semibold">Role</th>
                                        <th className="text-left py-3 px-4 font-semibold">Created</th>
                                        <th className="text-left py-3 px-4 font-semibold">Last Login</th>
                                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="py-4 px-4 font-medium text-white">{user.username}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-red-900/30 text-red-300' :
                                                    user.role === 'CRM OPS' ? 'bg-blue-900/30 text-blue-300' :
                                                        'bg-purple-900/30 text-purple-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-xs">{formatDate(user.created_at)}</td>
                                            <td className="py-4 px-4 text-gray-400 text-xs">{formatDate(user.last_login)}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-300'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={deletingId === user.id}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                                                >
                                                    {deletingId === user.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <h3 className="text-blue-300 font-semibold mb-2">📋 Users Info:</h3>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                            <li>Total users: <strong>{users.length}</strong></li>
                            <li>Last login shows when user last authenticated</li>
                            <li>You cannot delete yourself (admin protection)</li>
                            <li>Deleted users cannot be recovered</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
