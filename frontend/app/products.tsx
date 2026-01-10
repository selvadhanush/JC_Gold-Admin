import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';

export default function Products() {
    const [searchQuery, setSearchQuery] = useState('');

    const products = [
        {
            id: 1,
            name: '22K Gold Necklace',
            category: 'Necklaces',
            weight: '25.5g',
            price: '₹1,45,000',
            stock: 'In Stock',
            inStock: true,
        },
        {
            id: 2,
            name: 'Diamond Ring',
            category: 'Rings',
            weight: '5.2g',
            price: '₹85,000',
            stock: 'Low Stock',
            inStock: true,
        },
        {
            id: 3,
            name: 'Gold Bangles Set',
            category: 'Bangles',
            weight: '45.8g',
            price: '₹2,35,000',
            stock: 'Out of Stock',
            inStock: false,
        },
        {
            id: 4,
            name: 'Temple Jewellery Earrings',
            category: 'Earrings',
            weight: '12.3g',
            price: '₹68,500',
            stock: 'In Stock',
            inStock: true,
        },
        {
            id: 5,
            name: 'Gold Chain',
            category: 'Chains',
            weight: '18.7g',
            price: '₹95,000',
            stock: 'In Stock',
            inStock: true,
        },
    ];

    const categories = ['All', 'Necklaces', 'Rings', 'Bangles', 'Earrings', 'Chains'];
    const [selectedCategory, setSelectedCategory] = useState('All');

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                <View className="p-6">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-gray-800 mb-2">
                            Products
                        </Text>
                        <Text className="text-gray-600">
                            Manage your product inventory
                        </Text>
                    </View>

                    {/* Search Bar */}
                    <View className="mb-6">
                        <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex-row items-center">
                            <Text className="text-gray-400 mr-2 text-lg">🔍</Text>
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Search products..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Category Filter */}
                    <View className="mb-6">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="flex-row gap-2"
                        >
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => setSelectedCategory(category)}
                                    className={`px-5 py-2 rounded-full mr-2 ${selectedCategory === category
                                            ? 'bg-primary-500'
                                            : 'bg-white border border-gray-200'
                                        }`}
                                >
                                    <Text
                                        className={`font-semibold ${selectedCategory === category
                                                ? 'text-white'
                                                : 'text-gray-700'
                                            }`}
                                    >
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Products List */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">
                                All Products ({products.length})
                            </Text>
                            <TouchableOpacity className="bg-primary-500 px-4 py-2 rounded-xl active:opacity-80">
                                <Text className="text-white font-semibold">+ Add New</Text>
                            </TouchableOpacity>
                        </View>

                        {products.map((product) => (
                            <TouchableOpacity
                                key={product.id}
                                className="bg-white rounded-2xl p-5 mb-3 shadow-sm border border-gray-100 active:bg-gray-50"
                            >
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-lg font-bold text-gray-800 mb-1">
                                            {product.name}
                                        </Text>
                                        <Text className="text-sm text-gray-600 mb-2">
                                            {product.category} • {product.weight}
                                        </Text>
                                        <View
                                            className={`self-start px-3 py-1 rounded-full ${product.inStock
                                                    ? product.stock === 'Low Stock'
                                                        ? 'bg-yellow-100'
                                                        : 'bg-green-100'
                                                    : 'bg-red-100'
                                                }`}
                                        >
                                            <Text
                                                className={`text-xs font-semibold ${product.inStock
                                                        ? product.stock === 'Low Stock'
                                                            ? 'text-yellow-700'
                                                            : 'text-green-700'
                                                        : 'text-red-700'
                                                    }`}
                                            >
                                                {product.stock}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-xl font-bold text-primary-600 mb-2">
                                            {product.price}
                                        </Text>
                                        <TouchableOpacity className="bg-primary-50 px-3 py-1 rounded-lg active:opacity-80">
                                            <Text className="text-primary-600 font-semibold text-sm">
                                                Edit
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
