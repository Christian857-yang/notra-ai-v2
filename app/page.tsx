export default function Home() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "sans-serif"
    }}>
      <h1>✅ Notra AI 已成功部署</h1>
      <p>后端接口已准备好，请访问 <code>/api/notra</code></p>
    </div>
  );
}
