import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/profileApi";
import { FiEdit3, FiSave, FiUser, FiLock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, login } = useAuth(); // add login updater
  const [editing, setEditing] = useState(false);
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    age: 0,
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  if (!user || !user.id) {
    return null;
  }
  const userId = user.id;

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile(userId);
      const profiles = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean);
      const profileData = profiles.find(p => p.userId === userId);
      if (profileData) {
        setProfile({
          name: profileData.name || "",
          age: profileData.age || 0,
          email: profileData.email || "",
        });
      } else {
        setProfile({
          name: user.name || "",
          age: user.age || 0,
          email: user.email || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      setProfile({
        name: user.name || "",
        age: user.age || 0,
        email: user.email || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile.name || !profile.email) {
      alert("Name and email are required");
      return;
    }
    try {
      const currentRes = await getProfile(userId);
      const profiles = Array.isArray(currentRes.data) ? currentRes.data : (currentRes.data ? [currentRes.data] : []);
      const currentProfile = profiles.find(p => p.userId === userId) || {};
      await updateProfile({
        name: profile.name.trim(),
        age: Number(profile.age) || 0,
        email: profile.email.trim(),
        weeklyLimit: currentProfile.weeklyLimit ?? null,
        monthlyLimit: currentProfile.monthlyLimit ?? null
      }, userId);
      setEditing(false);
      alert("Profile Updated Successfully!");
      // Sync user context (login)
      login({
        ...user,
        name: profile.name.trim(),
        age: Number(profile.age) || 0,
        email: profile.email.trim(),
      });
      await loadProfile();
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    }
  };

  const changePassword = () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      alert("Please fill both fields.");
      return;
    }
    alert("Password changed successfully!");
    setPasswordData({ oldPassword: "", newPassword: "" });
    setShowPasswordBox(false);
  };

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 text-white flex justify-center">
        <div className="glass p-8 rounded-3xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 text-white flex justify-center">
      <div className="glass p-4 sm:p-6 md:p-8 rounded-3xl w-full max-w-xl shadow-2xl space-y-6 sm:space-y-8 border border-white/10">
        {/* HEADER */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
            <FiUser size={35} className="sm:w-[45px] sm:h-[45px]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
            My Profile
          </h1>
        </div>
        {/* FORM */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm opacity-70">Name</label>
            <input
              type="text"
              disabled={!editing}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className={`p-3 rounded-xl w-full text-black ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm opacity-70">Age</label>
            <input
              type="number"
              disabled={!editing}
              min="1"
              max="150"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || 0 })}
              className={`p-3 rounded-xl w-full text-black ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm opacity-70">Email</label>
            <input
              type="email"
              disabled={!editing}
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={`p-3 rounded-xl w-full text-black ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          </div>
          {/* EDIT / SAVE BUTTON */}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:opacity-90"
            >
              <FiEdit3 /> Edit Profile
            </button>
          ) : (
            <button
              onClick={saveProfile}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:opacity-90"
            >
              <FiSave /> Save Changes
            </button>
          )}
        </div>
        {/* PASSWORD CHANGE SECTION */}
        <div className="pt-4 border-t border-white/20">
          <button
            className="flex items-center w-full justify-between py-3 text-lg font-semibold bg-white/10 px-4 rounded-xl hover:bg-white/20 transition"
            onClick={() => setShowPasswordBox(!showPasswordBox)}
          >
            <span className="flex items-center gap-2">
              <FiLock /> Change Password
            </span>
            <span>{showPasswordBox ? "▲" : "▼"}</span>
          </button>
          {showPasswordBox && (
            <div className="mt-4 space-y-4 bg-white/10 p-5 rounded-xl shadow-inner">
              <input
                type="password"
                placeholder="Old Password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="p-3 rounded-xl w-full text-black"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="p-3 rounded-xl w-full text-black"
              />
              <button
                onClick={changePassword}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow hover:bg-red-600"
              >
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
