// src/store/Provider.jsx (hoặc đường dẫn của bạn)

import Context from './Context';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';

import { requestAuth, requestSearch } from '../config/request';
import useDebounce from '../hooks/useDebounce';

export function Provider({ children }) {
  const [dataUser, setDataUser] = useState({});          // ✅ luôn là object
  const [dataPayment, setDataPayment] = useState(null);
  const [dataMessages, setDataMessages] = useState([]);
  const [globalUsersMessage, setGlobalUsersMessage] = useState([]);

  const [valueSearch, setValueSearch] = useState('');
  const debouncedSearch = useDebounce(valueSearch, 500);
  const [dataSearch, setDataSearch] = useState([]);

  // ================== AUTH ================== //
  const fetchAuth = async () => {
    try {
      const res = await requestAuth();                // axios đã withCredentials = true

      // Nếu backend không trả auth (chưa đăng nhập)
      if (!res?.metadata?.auth) {
        setDataUser({});
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(
        res.metadata.auth,
        import.meta.env.VITE_SECRET_CRYPTO
      );
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      if (!originalText) {
        console.error('Decrypt user failed');
        setDataUser({});
        return null;
      }

      const user = JSON.parse(originalText);
      setDataUser(user);
      return user;
    } catch (err) {
      // ❌ Không được để lỗi văng ra làm crash React
      console.error('fetchAuth error:', err);
      setDataUser({});
      return null;
    }
  };

  // Chạy 1 lần khi app mount: nếu có cookie hợp lệ -> /api/auth ok -> set user
  useEffect(() => {
    (async () => {
      await fetchAuth();
    })();
  }, []);

  // ================== SEARCH GỢI Ý ================== //
  useEffect(() => {
    const fetchData = async () => {
      // Nếu ô search rỗng thì clear list, tránh call API thừa
      if (!debouncedSearch) {
        setDataSearch([]);
        return;
      }

      try {
        const res = await requestSearch(debouncedSearch);
        setDataSearch(res.metadata || []);
      } catch (err) {
        console.error('Search suggestion error:', err);
        setDataSearch([]);
      }
    };

    fetchData();
  }, [debouncedSearch]);

  return (
    <Context.Provider
      value={{
        dataUser,
        setDataUser,           // 🆕 Export để LoginUser có thể clear/update state
        dataPayment,
        setDataPayment,
        fetchAuth,             // để Login / Profile có thể gọi lại sau khi update
        dataSearch,
        setValueSearch,
        dataMessages,
        setDataMessages,
        globalUsersMessage,
        setGlobalUsersMessage,
      }}
    >
      {children}
    </Context.Provider>
  );
}
