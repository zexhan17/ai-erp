"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Permission {
    name: string;
}

interface Role {
    id: string;
    name: string;
    rolePermissions: { permission: Permission }[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/roles")
            .then((res) => res.json())
            .then((data) => {
                if (data.roles) setRoles(data.roles);
                else setError(data.error ?? "Failed to load roles");
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
                <Link href="/dashboard/chat" className="text-sm text-blue-600 hover:underline">
                    Manage via Chat →
                </Link>
            </div>

            {loading && (
                <div className="text-gray-400 text-center py-12">Loading...</div>
            )}

            {error && (
                <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}

            {!loading && !error && roles.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p>No roles yet.</p>
                    <p className="text-sm mt-1">
                        Use the{" "}
                        <Link href="/dashboard/chat" className="text-blue-500 hover:underline">
                            chat interface
                        </Link>{" "}
                        to manage roles.
                    </p>
                </div>
            )}

            {roles.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Permissions</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role, idx) => (
                                <tr
                                    key={role.id}
                                    className={`${idx < roles.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{role.name}</td>
                                    <td className="px-4 py-3">
                                        {role.rolePermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {role.rolePermissions.map(({ permission }) => (
                                                    <span
                                                        key={permission.name}
                                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                                                    >
                                                        {permission.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">no permissions</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{role.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
