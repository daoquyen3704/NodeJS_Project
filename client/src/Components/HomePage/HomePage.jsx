import classNames from "classnames/bind";
import styles from "./HomePage.module.scss";

import CardBody from "../CardBody/CardBody";
import { useState, useEffect, useMemo } from "react";
import {
  requestGetNewPost,
  requestGetPosts,
  requestPostSuggest,
} from "../../config/request";

import dayjs from "dayjs";
import { Link, useNavigate, useLocation } from "react-router-dom";

const cx = classNames.bind(styles);

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Trang chủ";
  }, []);

  // Helpers
  const getQueryParam = (param) =>
    new URLSearchParams(window.location.search).get(param);
  const setQueryParams = (params) => {
    const query = new URLSearchParams(location.search);
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") query.delete(k);
      else query.set(k, v);
    });
    const queryString = query.toString();
    navigate(
      queryString ? `${location.pathname}?${queryString}` : location.pathname,
      { replace: true }
    );
  };

  // State khởi tạo từ URL
  const [category, setCategory] = useState(
    () => getQueryParam("category") || ""
  );
  const [priceRange, setPriceRange] = useState(
    () => getQueryParam("priceRange") || ""
  );
  const [areaRange, setAreaRange] = useState(
    () => getQueryParam("areaRange") || ""
  );
  const [province, setProvince] = useState(
    () => getQueryParam("province") || ""
  );
  const [typeNews, setTypeNews] = useState(
    () => getQueryParam("typeNews") || "vip"
  );

  const [dataPost, setDataPost] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dataNewPost, setDataNewPost] = useState([]);
  const [dataPostSuggest, setDataPostSuggest] = useState([]);

  // Fetch danh sách theo filter
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = { category, priceRange, areaRange, province, typeNews };
      try {
        const res = await requestGetPosts(params);
        setDataPost(res?.metadata || []);
      } finally {
        setLoading(false);
      }
      setQueryParams(params);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, priceRange, areaRange, province, typeNews]);

  // Tin mới & gợi ý
  useEffect(() => {
    const fetchSide = async () => {
      try {
        console.log('🔄 Fetching new posts and suggestions...');
        const res = await requestGetNewPost();
        const resSuggest = await requestPostSuggest();
        console.log('📦 New posts response:', res);
        console.log('📦 Suggestions response:', resSuggest);
        setDataNewPost(res?.metadata || []);
        setDataPostSuggest(resSuggest?.metadata || []);
        console.log('✅ Set dataNewPost length:', res?.metadata?.length || 0);
        console.log('✅ Set dataPostSuggest length:', resSuggest?.metadata?.length || 0);
      } catch (error) {
        console.error('❌ Error fetching new posts:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error response:', error.response?.data);
      }
    };
    fetchSide();
  }, []);

  const totalPosts = useMemo(() => dataPost?.length || 0, [dataPost]);

  const resetAll = () => {
    setCategory("");
    setPriceRange("");
    setAreaRange("");
    setProvince("");
    setTypeNews("vip");
  };

  const provincesQuick = [
    "Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Bình Dương",
    "Đồng Nai",
    "Cần Thơ",
  ];

  return (
    <div className={cx("wrapper")}>
      <div className={cx("main")}>
        {/* HERO FILTER */}
        <div className={cx("hero")}>
          <div className={cx("hero__heading")}>
            <h1 className={cx("title")}>Tìm kiếm chỗ thuê giá tốt</h1>
            <p className={cx("subtitle")}>
              Công cụ tìm kiếm phòng trọ, nhà nguyên căn, căn hộ cho thuê, tìm
              người ở ghép nhanh chóng, hiệu quả!
            </p>
            <p className={cx("total")}>
              Hiện có <strong>{totalPosts}</strong> tin đang cho thuê
            </p>
          </div>

          {/* Tabs danh mục chính */}
          <div className={cx("tabs")}>
            {[
              { value: "", label: "Tất cả" },
              { value: "phong-tro", label: "Phòng trọ" },
              { value: "can-ho-chung-cu", label: "Căn hộ" },
              { value: "nha-nguyen-can", label: "Nhà ở" },
              { value: "o-ghep", label: "Ở ghép" },
              { value: "can-ho-mini", label: "Căn hộ mini" },
            ].map((t) => (
              <button
                key={t.value || "all"}
                className={cx("tab", { active: category === t.value })}
                onClick={() => setCategory(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter nhanh: GIỮ giá/diện tích/loại tin, XÓA khu vực (theo yêu cầu) */}
          <div className={cx("quickFilters")}>
            <div className={cx("filterRow")}>
              <div className={cx("selectGroup")}>
                <label>Khoảng giá</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="duoi-1-trieu">Dưới 1 triệu</option>
                  <option value="tu-1-2-trieu">1 - 2 triệu</option>
                  <option value="tu-2-3-trieu">2 - 3 triệu</option>
                  <option value="tu-3-5-trieu">3 - 5 triệu</option>
                  <option value="tu-5-7-trieu">5 - 7 triệu</option>
                  <option value="tu-7-10-trieu">7 - 10 triệu</option>
                  <option value="tu-10-15-trieu">10 - 15 triệu</option>
                  <option value="tren-15-trieu">Trên 15 triệu</option>
                </select>
              </div>

              <div className={cx("selectGroup")}>
                <label>Khu vực</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {provincesQuick.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className={cx("selectGroup")}>
                <label>Diện tích</label>
                <select
                  value={areaRange}
                  onChange={(e) => setAreaRange(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="duoi-20">Dưới 20 m²</option>
                  <option value="tu-20-30">20 - 30 m²</option>
                  <option value="tu-30-50">30 - 50 m²</option>
                  <option value="tu-50-70">50 - 70 m²</option>
                  <option value="tu-70-90">70 - 90 m²</option>
                  <option value="tren-90">Trên 90 m²</option>
                </select>
              </div>

              <div className={cx("selectGroup")}>
                <label>Loại tin</label>
                <div className={cx("toggle")}>
                  <button
                    className={cx({ active: typeNews === "vip" })}
                    onClick={() => setTypeNews("vip")}
                  >
                    Đề xuất
                  </button>
                  <button
                    className={cx({ active: typeNews === "normal" })}
                    onClick={() => setTypeNews("normal")}
                  >
                    Mới đăng
                  </button>
                </div>
              </div>

              <button className={cx("resetBtn")} onClick={resetAll}>
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        {/* NEW FEED – Tin mới đăng trong content chính */}
        <div className={cx("newFeed")}>
          <div className={cx("newFeed__head")}>
            <h2>Tin mới đăng</h2>
            <span className={cx("newFeed__count")}>
              {dataNewPost.length} tin
            </span>
          </div>
          <div className={cx("newFeed__list")}>
            {dataNewPost.map((item) => (
              <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                <div className={cx("newFeed__item")}>
                  <div className={cx("newFeed__thumb")}>
                    <img src={item.images?.[0]} alt={item.title} />
                  </div>
                  <div className={cx("newFeed__info")}>
                    <h4 className={cx("newFeed__title")}>{item.title}</h4>
                    <div className={cx("newFeed__meta")}>
                      <span className={cx("price")}>
                        {Number(item.price || 0).toLocaleString("vi-VN")} VNĐ
                      </span>
                      <span className={cx("time")}>
                        {dayjs(item.createdAt).format("DD/MM/YYYY")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* DANH SÁCH TIN CHÍNH */}
        <div className={cx("contentCard")}>
          {loading ? (
            <div className={cx("skeletonGrid")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cx("skeletonItem")} />
              ))}
            </div>
          ) : (
            <div className={cx("grid")}>
              {dataPost.map((post) => (
                <Link
                  key={post._id}
                  to={`/chi-tiet-tin-dang/${post._id}`}
                  className={cx("cardLink")}
                >
                  <CardBody post={post} />
                </Link>
              ))}
              {(!dataPost || dataPost.length === 0) && (
                <div className={cx("empty")}>
                  Không tìm thấy tin phù hợp. Hãy thử thay đổi tiêu chí lọc.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={cx("sidebar")}>
        <div className={cx("filterColumns")}>
          <div className={cx("filterCard")}>
            <h3>Chọn khu vực</h3>
            <div className={cx("vList")}>
              <a onClick={() => setProvince("")}>Tất cả khu vực</a>
              {provincesQuick.map((p) => (
                <a key={p} onClick={() => setProvince(p)}>
                  {p}
                </a>
              ))}
            </div>
          </div>

          {/* <div className={cx('filterCard')}>
            <h3>Lọc theo khoảng giá</h3>
            <div className={cx('vList')}>
              <a onClick={() => setPriceRange('')}>Thỏa thuận</a>
              <a onClick={() => setPriceRange('duoi-1-trieu')}>Dưới 1 triệu</a>
              <a onClick={() => setPriceRange('tu-1-2-trieu')}>1 - 2 triệu</a>
              <a onClick={() => setPriceRange('tu-1-3-trieu')}>1 - 3 triệu</a>
              <a onClick={() => setPriceRange('tu-3-5-trieu')}>3 - 5 triệu</a>
              <a onClick={() => setPriceRange('tu-5-10-trieu')}>5 - 10 triệu</a>
              <a onClick={() => setPriceRange('tu-10-40-trieu')}>10 - 40 triệu</a>
              <a onClick={() => setPriceRange('tu-40-70-trieu')}>40 - 70 triệu</a>
              <a onClick={() => setPriceRange('tu-70-100-trieu')}>70 - 100 triệu</a>
              <a onClick={() => setPriceRange('tren-100-trieu')}>Trên 100 triệu</a>
            </div>
          </div>

          <div className={cx('filterCard')}>
            <h3>Lọc theo diện tích</h3>
            <div className={cx('vList')}>
              <a onClick={() => setAreaRange('duoi-30')}>Dưới 30 m²</a>
              <a onClick={() => setAreaRange('tu-30-50')}>30 - 50 m²</a>
              <a onClick={() => setAreaRange('tu-50-80')}>50 - 80 m²</a>
              <a onClick={() => setAreaRange('tu-80-100')}>80 - 100 m²</a>
              <a onClick={() => setAreaRange('tu-100-150')}>100 - 150 m²</a>
              <a onClick={() => setAreaRange('tu-150-200')}>150 - 200 m²</a>
              <a onClick={() => setAreaRange('tu-200-250')}>200 - 250 m²</a>
              <a onClick={() => setAreaRange('tu-250-300')}>250 - 300 m²</a>
              <a onClick={() => setAreaRange('tu-300-500')}>300 - 500 m²</a>
              <a onClick={() => setAreaRange('tren-500')}>Trên 500 m²</a>
            </div>
          </div> */}
        </div>

        {/* GẦN BẠN */}
        <div className={cx("sideSection")}>
          <h3>Gần bạn</h3>
          <div className={cx("newPosts")}>
            {dataPostSuggest.map((item) => (
              <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                <div className={cx("postItem")}>
                  <div className={cx("thumb")}>
                    <img src={item.images?.[0]} alt={item.title} />
                    <span className={cx("badge")}>Gợi ý</span>
                  </div>
                  <div className={cx("info")}>
                    <h4 className={cx("name")}>{item.title}</h4>
                    <div className={cx("meta")}>
                      <span className={cx("price")}>
                        {Number(item.price || 0).toLocaleString("vi-VN")} VNĐ
                      </span>
                      <span className={cx("time")}>
                        {dayjs(item.createdAt).format("DD/MM/YYYY")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default HomePage;
