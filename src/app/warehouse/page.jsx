import React from 'react'
import WarehouseProducts from './WarehouseProducts'
import ProductList from './ProductList'
import Navbar from '../components/Navbar'

const warehouse = () => {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Navbar />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-4">
        <WarehouseProducts />
        <ProductList />
      </div>
    </div>
  );
}

export default warehouse