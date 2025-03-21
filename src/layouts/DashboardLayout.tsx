import React, { useContext, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/userContext';
import axios from 'axios';
import { BASE_URL, SOCKET_URL } from '../config/url';
import { io, Socket } from 'socket.io-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend Day.js with the relativeTime plugin
dayjs.extend(relativeTime);

interface Notification {
  _id: string;
  title: string;
  message: string;
  timestamp: string;
  seen: boolean;
  createdAt: string;
}

const CampaignerDashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notificationSection, setNotificationSection] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useContext(AuthContext) || {};
  const notificationRef = useRef<HTMLDivElement>(null);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [unSeenIds, setUnSeenIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect to Socket.IO server
  useEffect(() => {
    if (user?.userId) {
      socketRef.current = io(`${SOCKET_URL}`); // Your server URL

      // Join the user's room
      socketRef.current.emit('join-room', user.userId);

      // Listen for new notifications
      socketRef.current.on('new-notification', (newNotification: Notification) => {
        console.log('New notification received:', newNotification);
        setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
        setNewNotificationCount((prevCount) => prevCount + 1);
        setUnSeenIds((prevIds) => [newNotification._id, ...prevIds]);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user?.userId]);

  // Close the notification section when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationSection(false);
        markNotificationsAsSeen(); // Mark notifications as seen when the section is closed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [unSeenIds]); // Add unSeenIds as a dependency

  // Mark notifications as seen
  const markNotificationsAsSeen = async () => {
    try {
      if (unSeenIds.length > 0) {
        await axios.put(
          `${BASE_URL}/notifications/update`,
          {
            ids: unSeenIds,
            seen: true,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        // Update local state to reflect the seen status
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            unSeenIds.includes(notification._id)
              ? { ...notification, seen: true }
              : notification
          )
        );

        // Reset the unseen IDs and notification count
        setUnSeenIds([]);
        setNewNotificationCount(0);
      }
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  // Fetch notifications
  useEffect(() => {
    if(!user){return}
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/notifications/get/${user?.userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setNotifications(res.data);

        // Calculate the number of unseen notifications
        const unseenNotifications = res.data.filter((notification: Notification) => !notification.seen);
        setNewNotificationCount(unseenNotifications.length);
        setUnSeenIds(unseenNotifications.map((notification: Notification) => notification._id));
      } catch (error) {
        console.log(error);
      }
    };

    fetchNotifications();
  }, [user?.userId]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen font-onest">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300`}>
        {/* Search Bar */}
        <div className="flex justify-end gap-4 py-4 px-6 items-center">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#BEE36E]">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 outline-none text-gray-700 placeholder-gray-400"
            />
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-500 mx-3 cursor-pointer" />
          </div>

          <div className="w-[1px] h-10 bg-gray-400"></div>

          {/* Notification Bell Icon */}
          <div
            onClick={() => setNotificationSection(!notificationSection)}
            className={`relative flex items-center cursor-pointer p-2 rounded-lg ${
              notificationSection ? 'bg-gray-100' : ''
            } hover:bg-gray-100`}
          >
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {newNotificationCount}
            </div>
            <BellIcon className="w-6 h-6" />
          </div>

          {/* Notification Section */}
          {notificationSection && (
            <>
              {/* Transparent Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-30 z-20"></div>

              {/* Notification Dropdown */}
              <div
                ref={notificationRef}
                className="absolute top-16 right-4 bg-white shadow-lg rounded-lg p-4 z-30 w-80 max-h-96 overflow-y-auto"
              >
                <p className="text-gray-600 font-semibold">Notifications</p>
                <div className="w-full h-[1px] bg-gray-200 my-2"></div>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`flex flex-col items-start my-2 p-2 rounded-md ${
                        notification.seen ? '' : 'bg-gray-200'
                      }`}
                    >
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {dayjs(notification.createdAt).fromNow()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No notifications</p>
                )}
              </div>
            </>
          )}

          <div className="w-[1px] h-10 bg-gray-400"></div>

          {/* Profile Link */}
          <Link
            to="/user/dashboard/profile"
            className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100"
          >
            {
              user?.profilePicture ? (
                <img
                  src={user?.profilePicture}
                  alt="Profile"
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-6 h-6" />
              )
            }
            
          </Link>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CampaignerDashboardLayout;