import Context from './Context';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';
import { requestAuth, requestSearch } from '../config/request';
import useDebounce from '../hooks/useDebounce';

export function Provider({ children }) {
  const [dataUser, setDataUser] = useState(null);
  const [dataPayment, setDataPayment] = useState(null);
  const [dataMessages, setDataMessages] = useState([]);
  const [globalUsersMessage, setGlobalUsersMessage] = useState([]);

  const fetchAuth = async () => {
    try {
      const res = await requestAuth(); // axios đã withCredentials = true nên cookie tự gửi

      const bytes = CryptoJS.AES.decrypt(
        res.metadata.auth,
        import.meta.env.VITE_SECRET_CRYPTO
      );
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      if (!originalText) {
        throw new Error('Decrypt failed');
      }

      const user = JSON.parse(originalText);
      setDataUser(user);
      return user;
    } catch (err) {
      console.error('fetchAuth error:', err);
      setDataUser(null);
      throw err;
    }
  };

  // Auto fetch user nếu đang đăng nhập (nếu /api/auth trả 401 thì bỏ qua)
  useEffect(() => {
    (async () => {
      try {
        await fetchAuth();
      } catch (e) {
        // Không logged in thì thôi, đừng làm gì
      }
    })();
  }, []);

  // ===== SEARCH =====
  const [valueSearch, setValueSearch] = useState('');
  const debouncedSearch = useDebounce(valueSearch, 500);
  const [dataSearch, setDataSearch] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearch) {
        setDataSearch([]);
        return;
      }
      const res = await requestSearch(debouncedSearch);
      setDataSearch(res.metadata);
    };
    fetchData();
  }, [debouncedSearch]);

  return (
    <Context.Provider
      value={{
        dataUser,
        dataPayment,
        setDataPayment,
        fetchAuth,
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
