const StrictMode = __vite__cjsImport0_react["StrictMode"];const createRoot = __vite__cjsImport1_reactDom_client["createRoot"];const _jsxDEV = __vite__cjsImport5_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=284a7ecc";
import __vite__cjsImport1_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=284a7ecc";
import axios from "/node_modules/.vite/deps/axios.js?v=284a7ecc";
import "/src/index.css";
import App from "/src/App.jsx";
var _jsxFileName = "E:/Luận văn tốt nghiệp/baoloc-homestay/src/main.jsx";
import __vite__cjsImport5_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=284a7ecc";
// Global Axios Interceptor for handling token expiration
axios.interceptors.response.use((response) => response, (error) => {
	if (error.response && (error.response.status === 401 || error.response.status === 403)) {
		// Xóa thông tin đăng nhập khi token hết hạn hoặc sai quyền
		sessionStorage.removeItem("token");
		sessionStorage.removeItem("user");
		sessionStorage.removeItem("isLoggedIn");
		// Chuyển hướng về trang đăng nhập với thông báo
		window.location.href = "/auth?expired=true";
	}
	return Promise.reject(error);
});
createRoot(document.getElementById("root")).render(/* @__PURE__ */ _jsxDEV(StrictMode, { children: /* @__PURE__ */ _jsxDEV(App, {}, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 26,
	columnNumber: 5
}, this) }, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 25,
	columnNumber: 3
}, this));

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU87QUFDUCxPQUFPLFNBQVM7Ozs7QUFHaEIsTUFBTSxhQUFhLFNBQVMsS0FDekIsYUFBYSxXQUNiLFVBQVU7Q0FDVCxJQUFJLE1BQU0sYUFBYSxNQUFNLFNBQVMsV0FBVyxPQUFPLE1BQU0sU0FBUyxXQUFXLE1BQU07O0VBRXRGLGVBQWUsV0FBVyxPQUFPO0VBQ2pDLGVBQWUsV0FBVyxNQUFNO0VBQ2hDLGVBQWUsV0FBVyxZQUFZOztFQUd0QyxPQUFPLFNBQVMsT0FBTztDQUN6QjtDQUNBLE9BQU8sUUFBUSxPQUFPLEtBQUs7QUFDN0IsQ0FDRjtBQUVBLFdBQVcsU0FBUyxlQUFlLE1BQU0sQ0FBQyxFQUFFLE9BQzFDLHdCQUFDLFlBQUQsWUFDRSx3QkFBQyxLQUFELENBQU07Ozs7U0FDSTs7OztRQUNkIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIm1haW4uanN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0cmljdE1vZGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGNyZWF0ZVJvb3QgfSBmcm9tICdyZWFjdC1kb20vY2xpZW50J1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5pbXBvcnQgQXBwIGZyb20gJy4vQXBwLmpzeCdcblxuLy8gR2xvYmFsIEF4aW9zIEludGVyY2VwdG9yIGZvciBoYW5kbGluZyB0b2tlbiBleHBpcmF0aW9uXG5heGlvcy5pbnRlcmNlcHRvcnMucmVzcG9uc2UudXNlKFxuICAocmVzcG9uc2UpID0+IHJlc3BvbnNlLFxuICAoZXJyb3IpID0+IHtcbiAgICBpZiAoZXJyb3IucmVzcG9uc2UgJiYgKGVycm9yLnJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxIHx8IGVycm9yLnJlc3BvbnNlLnN0YXR1cyA9PT0gNDAzKSkge1xuICAgICAgLy8gWMOzYSB0aMO0bmcgdGluIMSRxINuZyBuaOG6rXAga2hpIHRva2VuIGjhur90IGjhuqFuIGhv4bq3YyBzYWkgcXV54buBblxuICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ2lzTG9nZ2VkSW4nKTtcbiAgICAgIFxuICAgICAgLy8gQ2h1eeG7g24gaMaw4bubbmcgduG7gSB0cmFuZyDEkcSDbmcgbmjhuq1wIHbhu5tpIHRow7RuZyBiw6FvXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvYXV0aD9leHBpcmVkPXRydWUnO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICB9XG4pO1xuXG5jcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykpLnJlbmRlcihcbiAgPFN0cmljdE1vZGU+XG4gICAgPEFwcCAvPlxuICA8L1N0cmljdE1vZGU+LFxuKVxuIl19