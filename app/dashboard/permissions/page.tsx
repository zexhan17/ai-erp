"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Role {
    name: string;
}

interface Permission {
    id: string;
    name: string;
    rolePermissions: { role: Role }[];
}

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/permissions")
            .then((res) => res.json())
            .then((data) => {
                if (data.permissions) setPermissions(data.permissions);
                else setError(data.error ?? "Failed to load permissions");
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 w-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
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

            {!loading && !error && permissions.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p>No permissions yet.</p>
                    <p className="text-sm mt-1">
                        Use the{" "}
                        <Link href="/dashboard/chat" className="text-blue-500 hover:underline">
                            chat interface
                        </Link>{" "}
                        to manage permissions.
                    </p>
                </div>
            )}

            {permissions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Permission</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned to Roles</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map((permission, idx) => (
                                <tr
                                    key={permission.id}
                                    className={`${idx < permissions.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{permission.name}</td>
                                    <td className="px-4 py-3">
                                        {permission.rolePermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {permission.rolePermissions.map(({ role }) => (
                                                    <span
                                                        key={role.name}
                                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                                    >
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{permission.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
