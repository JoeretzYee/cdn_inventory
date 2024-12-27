import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // import your Firebase config
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Swal from "sweetalert2"; // Import SweetAlert2
import * as XLSX from "xlsx"; // Import the xlsx library
import { saveAs } from "file-saver";
import "../css/Tabs.css";

function Tabs() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "add" or "subtract"
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [modalValue, setModalValue] = useState(0);

  // state for edited
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemPrice, setEditItemPrice] = useState(0);
  const [editItemQuantity, setEditItemQuantity] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExpenseEditModal, setShowExpenseEditModal] = useState(false);

  // State for editing for expenses (name and price)
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // State for add expenses modal
  const [expenseName, setExpenseName] = useState("");
  const [expensePrice, setExpensePrice] = useState(0);
  const [expenses, setExpenses] = useState([]);

  // New state for Add Item modal
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemQuantity, setNewItemQuantity] = useState(0);
  useEffect(() => {
    //fetch items
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "stocks"));
        const fetchedItems = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Include the document ID
          ...doc.data(),
        }));
        console.log("fetchitems: ", fetchedItems);
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };

    //fetch expenses
    const fetchExpenses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "expenses"));
        const fetchedExpenses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error("Error fetching expenses: ", error);
      }
    };

    fetchItems();
    fetchExpenses();
  }, [expenses]);

  console.log(items);

  const handleOpenModal = (filteredIndex, type) => {
    const originalIndex = items.findIndex(
      (item) => item.id === filteredItems[filteredIndex]?.id
    );
    setCurrentItemIndex(originalIndex);
    setModalType(type); // Set to either "subtract" or "addQuantity"
    setModalValue(0); // Reset quantity input
    setShowModal(true);
  };

  const handleAddExpense = async () => {
    if (!expenseName.trim() || expensePrice <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Please provide a valid expense name and price.",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      // Add new expense to Firebase
      await addDoc(collection(db, "expenses"), {
        name: expenseName.trim(),
        price: expensePrice,
        date: new Date(),
      });

      // Immediately fetch and update the expenses state
      const querySnapshot = await getDocs(collection(db, "expenses"));
      const fetchedExpenses = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(fetchedExpenses); // Update expenses state

      Swal.fire({
        icon: "success",
        title: "Expense Added",
        text: `Added ${expenseName} with price ₱${expensePrice.toLocaleString()}.`,
        confirmButtonText: "OK",
      });

      // Clear the input fields
      setExpenseName("");
      setExpensePrice(0);

      // Close the modal programmatically
      document.querySelector("#addExpenseModal .btn-close").click();
    } catch (error) {
      console.error("Error adding expense: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add expense. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleModalSubmit = async () => {
    if (modalType === "add") {
      try {
        // Logic for adding a new item
        await addDoc(collection(db, "stocks"), {
          name: newItemName,
          price: newItemPrice,
          quantity: newItemQuantity,
        });
        Swal.fire({
          icon: "success",
          title: "Expense Added",
          text: `Added ${newItemName} with price ₱${newItemPrice.toLocaleString()}.`,
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error adding item: ", error);
      }
    } else if (modalType === "subtract" || modalType === "addQuantity") {
      try {
        const updatedItems = [...items];
        const itemToUpdate = updatedItems[currentItemIndex];
        const valueToUpdate =
          modalType === "subtract"
            ? Math.min(modalValue, itemToUpdate.quantity) // Subtract
            : modalValue; // Add for "addQuantity"
        itemToUpdate.quantity =
          modalType === "subtract"
            ? itemToUpdate.quantity - valueToUpdate
            : itemToUpdate.quantity + valueToUpdate;

        await updateDoc(doc(db, "stocks", itemToUpdate.id), {
          quantity: itemToUpdate.quantity,
        });

        setItems(updatedItems);

        Swal.fire({
          icon: "success",
          title: "Quantity Updated",
          text: `${
            modalType === "subtract" ? "Subtracted" : "Added"
          } ${valueToUpdate} to ${itemToUpdate.name}.`,
          confirmButtonText: "OK",
        });

        setShowModal(false);
      } catch (error) {
        console.error("Error updating item: ", error);
      }
    }
  };
  const generateReport = () => {
    const reportData = [];

    // Add headers for stock items
    reportData.push(["Name", "Price", "Quantity"]);

    // Create the list of items with name, price, and quantity
    items.forEach((item) => {
      reportData.push([item.name, item.price, item.quantity]); // Array format for each row
    });

    // Create a list of expenses with their prices
    const expenseList = expenses.map((expense, index) => [
      `${index + 1}. ${expense.name}`,
      expense.price,
    ]);

    // Calculate total expenses
    const totalExpenses = expenses.reduce(
      (acc, expense) => acc + parseInt(expense.price, 10),
      0
    );

    // Calculate the total stock value (sum of price * quantity for each item)
    const totalStockValue = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    // Calculate the final total (total expenses + total stock value)
    const finalTotal = totalExpenses + totalStockValue;

    // Format the totals properly (using toLocaleString for thousands separators)
    const formattedTotalExpenses = totalExpenses.toLocaleString();
    const formattedFinalTotal = finalTotal.toLocaleString();

    // Combine the item data and expense list into one array for the worksheet
    const finalReport = [
      ...reportData, // Add the item rows
      [], // Empty row between items and expenses
      ["Expense:", "Price"], // Expense header with price
      ...expenseList, // Expense list
      [], // Empty row between expenses and totals
      [`Total Expenses: ${formattedTotalExpenses}`], // Total expenses
      [`Total: ${formattedFinalTotal}`], // Final total
    ];

    // Create a worksheet from the final report array
    const ws = XLSX.utils.aoa_to_sheet(finalReport);

    // Create a workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Write the workbook and export the file
    const fileData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([fileData], { type: "application/octet-stream" }),
      "stocks_report.xlsx"
    );
  };

  // Function to handle item deletion
  const handleDeleteItem = async (itemId) => {
    try {
      // Confirm deletion using SweetAlert
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        // Delete the item from Firestore
        await deleteDoc(doc(db, "stocks", itemId));

        // Remove the item locally to update the UI
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Your item has been deleted.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error deleting item: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete item. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      // Delete the document from the expenses collection
      const expenseRef = doc(db, "expenses", expenseId); // Assuming "expenses" is your collection
      await deleteDoc(expenseRef);

      // After deleting, update the UI (remove the deleted expense from the state)
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== expenseId)
      );
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = filteredItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const expensesTotal = expenses.reduce(
    (acc, expense) => acc + Number(expense.price),
    0
  );

  const totalAmount = total + expensesTotal;

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemPrice(item.price);
    setEditItemQuantity(item.quantity);
    setShowEditModal(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpenseId(expense.id);
    setEditName(expense.name);
    setEditPrice(expense.price);
    setShowExpenseEditModal(true); // This should be tied to your modal visibility state
  };

  const handleEditExpense = async (expenseId, name, price) => {
    try {
      const expenseRef = doc(db, "expenses", expenseId); // Reference to the expense document
      await updateDoc(expenseRef, {
        name: name, // Update the name
        price: price, // Update the price
      });

      // After updating, update the state to reflect the changes in the UI
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === expenseId ? { ...expense, name, price } : expense
        )
      );
      Swal.fire({
        icon: "success",
        title: "Item Updated",
        text: `${name} has been updated successfully.`,
        confirmButtonText: "OK",
      });

      setShowExpenseEditModal(false);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    try {
      const updatedItem = {
        name: editItemName,
        price: editItemPrice,
        quantity: editItemQuantity,
      };

      await updateDoc(doc(db, "stocks", editingItem.id), updatedItem);

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editingItem.id ? { ...item, ...updatedItem } : item
        )
      );

      Swal.fire({
        icon: "success",
        title: "Item Updated",
        text: `${editItemName} has been updated successfully.`,
        confirmButtonText: "OK",
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating item:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update item. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="container mt-5">
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Header with Total and Add Button */}
      <div className="d-flex justify-content-between mb-3 ">
        <div>
          <strong>Total: ₱{totalAmount.toLocaleString()}</strong>
          <br />
          <strong>
            <ol>
              {expenses.map((expense) => (
                <li key={expense.id} className="tabs_li">
                  {expense.name} - ₱{expense.price.toLocaleString()} &nbsp;{" "}
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpenEditModal(expense)}
                  >
                    <i class="fas fa-edit"></i>
                  </button>{" "}
                  &nbsp;
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>{" "}
                </li>
              ))}
            </ol>
          </strong>
        </div>

        <div className="d-flex align-items-center  gap-3 ">
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#addExpenseModal"
          >
            Add expenses
          </button>
          <button
            className="btn btn-success"
            onClick={() => handleOpenModal(null, "add")}
            data-bs-toggle="modal"
            data-bs-target="#actionModal"
          >
            Add Item
          </button>
          <button
            className="btn btn-warning text-white"
            onClick={generateReport}
          >
            Generate Report
          </button>
        </div>
      </div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
            onClick={() => setActiveTab("tab1")}
          >
            All
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === "tab1" && (
          <div className="tab-pane fade show active">
            <div className="table-container">
              <table className="table table-striped my_table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Quantity</th>
                    <th colSpan={4}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name} </td>
                      <td className="text-center">₱{item.price}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenModal(index, "subtract")}
                          disabled={item.quantity === 0}
                          data-bs-toggle="modal"
                          data-bs-target="#actionModal"
                        >
                          <i class="fas fa-minus"></i>
                        </button>{" "}
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleOpenModal(index, "addQuantity")} // Correct modalType
                          data-bs-toggle="modal"
                          data-bs-target="#actionModal"
                        >
                          <i class="fas fa-plus"></i>
                        </button>{" "}
                        &nbsp;
                        <button
                          type="button"
                          class="btn btn-sm btn-primary"
                          onClick={() => handleEditItem(item)}
                        >
                          <i class="fas fa-edit"></i>
                        </button>{" "}
                        &nbsp;
                        <button
                          type="button"
                          class="btn btn-sm btn-danger"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <div
        className={`modal fade ${showEditModal ? "show" : ""}`}
        id="editModal"
        tabIndex="-1"
        aria-labelledby="editModalLabel"
        aria-hidden={!showEditModal}
        style={{ display: showEditModal ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editModalLabel">
                Edit Item
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <label>Name:</label>
              <input
                type="text"
                className="form-control mb-3"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
              />
              <label>Price:</label>
              <input
                type="number"
                className="form-control mb-3"
                value={editItemPrice}
                onChange={(e) => setEditItemPrice(Number(e.target.value))}
              />
              <label>Quantity:</label>
              <input
                type="number"
                className="form-control"
                value={editItemQuantity}
                onChange={(e) => setEditItemQuantity(Number(e.target.value))}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      {showExpenseEditModal && (
        <div
          className={`modal fade ${showExpenseEditModal ? "show" : ""}`}
          id="editModal"
          tabIndex="-1"
          aria-labelledby="editModalLabel"
          aria-hidden={!showExpenseEditModal}
          style={{ display: showExpenseEditModal ? "block" : "none" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editModalLabel">
                  Edit Expense
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setShowExpenseEditModal(false)} // Close the modal
                ></button>
              </div>
              <div className="modal-body">
                <label>Name:</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)} // Handle name change
                />
                <label>Price:</label>
                <input
                  type="number"
                  className="form-control"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))} // Handle price change
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExpenseEditModal(false)} // Close the modal without saving
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleEditExpense(editingExpenseId, editName, editPrice);
                    // Close the modal after saving
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <div
        className="modal fade"
        id="addExpenseModal"
        tabIndex="-1"
        aria-labelledby="addExpenseModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addExpenseModalLabel">
                Add Expenses
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <label>Expenses:</label>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Type Here"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
              <label>Price:</label>
              <input
                type="number"
                className="form-control"
                placeholder="Type Here"
                min="0"
                value={expensePrice}
                onChange={(e) => setExpensePrice(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddExpense} // Add logic to save expense
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add Item */}
      <div
        className="modal fade"
        id="actionModal"
        tabIndex="-1"
        aria-labelledby="actionModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="actionModalLabel">
                {modalType === "add" ? "Add New Item" : "Subtract Quantity"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "add" && (
                <>
                  <label>Item Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <label>Price:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    min="0"
                  />
                  <label>Quantity:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                    min="1"
                  />
                </>
              )}

              {(modalType === "subtract" || modalType === "addQuantity") && (
                <>
                  <label>
                    Enter quantity to{" "}
                    {modalType === "subtract" ? "subtract" : "add"}:
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={modalValue}
                    onChange={(e) => setModalValue(Number(e.target.value))}
                    min="1"
                    max={
                      modalType === "subtract"
                        ? items[currentItemIndex]?.quantity
                        : undefined
                    }
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleModalSubmit}
                disabled={
                  modalType === "add" &&
                  (newItemName === "" ||
                    newItemPrice <= 0 ||
                    newItemQuantity <= 0)
                }
                data-bs-dismiss="modal"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tabs;
