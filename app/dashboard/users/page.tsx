"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Role {
    name: string;
}

interface User {
    id: string;
    email: string;
    createdAt: string;
    userRoles: { role: Role }[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.users) setUsers(data.users);
                else setError(data.error ?? "Failed to load users");
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    async function handleDelete(user: User) {
        if (!confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
        setDeleting(user.id);
        try {
            const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } else {
                const data = await res.json();
                alert(data.error ?? "Failed to delete user");
            }
        } catch {
            alert("Network error");
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <Link href="/dashboard/chat" className="text-sm text-blue-600 hover:underline">
                    Manage via Chat →
                </Link>
            </div>

            {loading && (
                <div className="text-gray-400 text-center py-12">Loading...</div>
            )}

            {error && (
                <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && users.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p>No users yet.</p>
                    <p className="text-sm mt-1">
                        Use the{" "}
                        <Link href="/dashboard/chat" className="text-blue-500 hover:underline">
                            chat interface
                        </Link>{" "}
                        to create users.
                    </p>
                </div>
            )}

            {users.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Roles</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr
                                    key={user.id}
                                    className={`${idx < users.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                                    <td className="px-4 py-3">
                                        {user.userRoles.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.userRoles.map(({ role }) => (
                                                    <span
                                                        key={role.name}
                                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                                    >
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">no roles</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                        {user.id}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(user)}
                                            disabled={deleting === user.id}
                                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-40"
                                        >
                                            {deleting === user.id ? "Deleting…" : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
