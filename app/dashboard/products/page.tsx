"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    createdAt: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => {
                if (data.products) setProducts(data.products);
                else setError(data.error ?? "Failed to load products");
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    async function handleDelete(product: Product) {
        if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;
        setDeleting(product.id);
        try {
            const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
            if (res.ok) {
                setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } else {
                const data = await res.json();
                alert(data.error ?? "Failed to delete product");
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
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
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

            {!loading && !error && products.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p>No products yet.</p>
                    <p className="text-sm mt-1">
                        Use the{" "}
                        <Link href="/dashboard/chat" className="text-blue-500 hover:underline">
                            chat interface
                        </Link>{" "}
                        to create products.
                    </p>
                </div>
            )}

            {products.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, idx) => (
                                <tr
                                    key={product.id}
                                    className={`${idx < products.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{product.description ?? "—"}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">${product.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(product.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(product)}
                                            disabled={deleting === product.id}
                                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-40"
                                        >
                                            {deleting === product.id ? "Deleting…" : "Delete"}
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
