'use client';

import { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function CreateUserPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'CRM OPS'
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

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

            setTimeout(() => setMessage(''), 5000);

        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-800 rounded-lg shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">Create New User</h1>
                    <p className="text-gray-400 mb-8">Admin Only - Create new team member accounts</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            <p className="text-sm text-gray-400 mt-1">Format: firstname.lastname (e.g., john.smith)</p>
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

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <h3 className="text-blue-300 font-semibold mb-2">📋 Important Notes:</h3>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                            <li>Users should change their password on first login</li>
                            <li>Username format: firstname.lastname</li>
                            <li>CRM OPS users can create and manage bonuses</li>
                            <li>Only admins can create new users</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
