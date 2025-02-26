import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import NotificationItem from "../components/notification-item.component";
import NotificationComment from "../components/notification-comment.component";
import NoData from "../components/no-data.component";
import LoadMore from "../components/load-more.component";
import InPageNavigation from "../components/inpage-navigation.component";

const Notifications = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchNotifications();
    }
  }, [isLoaded, isSignedIn]);
  
  const fetchNotifications = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const token = await user.getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/notifications?page=${loadMore ? page + 1 : 1}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (loadMore) {
        setNotifications([...notifications, ...response.data.notifications]);
        setPage(page + 1);
        setHasMore(response.data.hasMore);
        setLoadingMore(false);
      } else {
        setNotifications(response.data.notifications);
        setHasMore(response.data.hasMore);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      const token = await user.getToken();
      await axios.put(
        `${import.meta.env.VITE_SERVER}/notifications/read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update notification in state
      setNotifications(
        notifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const token = await user.getToken();
      await axios.put(
        `${import.meta.env.VITE_SERVER}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update all notifications in state
      setNotifications(
        notifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="btn-light"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <InPageNavigation navItems={["All", "Unread"]}>
          <div>
            {notifications.length > 0 ? (
              <>
                <div className="border-t border-grey">
                  {notifications.map(notification => (
                    notification.type === 'comment' ? (
                      <NotificationComment 
                        key={notification._id} 
                        notification={notification} 
                        onRead={markAsRead} 
                      />
                    ) : (
                      <NotificationItem 
                        key={notification._id} 
                        notification={notification} 
                        onRead={markAsRead} 
                      />
                    )
                  ))}
                </div>
                
                <LoadMore 
                  onClick={() => fetchNotifications(true)} 
                  loading={loadingMore} 
                  hasMore={hasMore} 
                />
              </>
            ) : (
              <NoData 
                message="You don't have any notifications yet" 
                icon="fi-rr-bell"
                actionText={null}
              />
            )}
          </div>
          
          <div>
            {notifications.filter(n => !n.read).length > 0 ? (
              <>
                <div className="border-t border-grey">
                  {notifications
                    .filter(notification => !notification.read)
                    .map(notification => (
                      notification.type === 'comment' ? (
                        <NotificationComment 
                          key={notification._id} 
                          notification={notification} 
                          onRead={markAsRead} 
                        />
                      ) : (
                        <NotificationItem 
                          key={notification._id} 
                          notification={notification} 
                          onRead={markAsRead} 
                        />
                      )
                    ))
                  }
                </div>
              </>
            ) : (
              <NoData 
                message="You don't have any unread notifications" 
                icon="fi-rr-bell-slash"
                actionText={null}
              />
            )}
          </div>
        </InPageNavigation>
      </section>
    </Animate>
  );
};

export default Notifications;
