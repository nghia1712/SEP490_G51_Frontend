import { useState } from "react";
import inventoryAPI from "../API/inventoryAPI";

const useInventory = () => {
    const [inventories, setInventories] = useState([]);
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all inventories
    const fetchInventories = async () => {
        setLoading(true);
        try {
            const response = await inventoryAPI.getAll();
            setInventories(response.data);
        } catch (err) {
            setError(err.message || "Failed to fetch inventories");
        } finally {
            setLoading(false);
        }
    };

    // Fetch inventory layout
    const fetchInventoryLayout = async () => {
        setLoading(true);
        try {
            const response = await inventoryAPI.getLayout();
            setInventory(response.data);
        } catch (err) {
            setError(err.message || "Failed to fetch inventory layout");
        } finally {
            setLoading(false);
        }
    };

    // Create new inventory
    const createInventory = async (data) => {
        setLoading(true);
        try {
            const response = await inventoryAPI.create(data);
            setInventories([...inventories, response.data]);
        } catch (err) {
            setError(err.message || "Failed to create inventory");
        } finally {
            setLoading(false);
        }
    };

    // Add product to shelf
    const addProductToShelf = async (data) => {
        setLoading(true);
        try {
            await inventoryAPI.addProduct(data);
        } catch (err) {
            setError(err.message || "Failed to add product to shelf");
        } finally {
            setLoading(false);
        }
    };

    // Add product to shelf with quantity
    const addProductToShelfWithQuantity = async (data) => {
        setLoading(true);
        try {
            await inventoryAPI.addProductWithQuantity(data);
        } catch (err) {
            setError(err.message || "Failed to add product to shelf with quantity");
        } finally {
            setLoading(false);
        }
    };

    // Remove product from shelf
    const removeProductFromShelf = async (data) => {
        setLoading(true);
        try {
            await inventoryAPI.removeProduct(data);
        } catch (err) {
            setError(err.message || "Failed to remove product from shelf");
        } finally {
            setLoading(false);
        }
    };

    // Import auto distribute
    const importAutoDistribute = async (data) => {
        setLoading(true);
        try {
            await inventoryAPI.importAuto(data);
        } catch (err) {
            setError(err.message || "Failed to auto distribute import");
        } finally {
            setLoading(false);
        }
    };

    // Delete inventory
    const deleteInventory = async (id) => {
        setLoading(true);
        try {
            await inventoryAPI.delete(id);
            setInventories(inventories.filter(inv => inv._id !== id));
        } catch (err) {
            setError(err.message || "Failed to delete inventory");
        } finally {
            setLoading(false);
        }
    };

    return {
        inventories,
        inventory,
        loading,
        error,
        fetchInventories,
        fetchInventoryLayout,
        createInventory,
        addProductToShelf,
        addProductToShelfWithQuantity,
        removeProductFromShelf,
        importAutoDistribute,
        deleteInventory,
    };
};
export default useInventory;