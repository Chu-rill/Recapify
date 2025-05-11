import { useState } from "react";
import { deleteAccount, logout } from "../services/auth-service";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "./ui/sonner";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal = ({ isOpen, onClose }: DeleteAccountModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { setUser, setAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();

      // Log the user out
      logout();
      setUser(null);
      setAuthenticated(false);

      toast.success("Your account has been deleted");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Account</h3>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete your account? This action cannot be
          undone, and all your data will be permanently lost.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
