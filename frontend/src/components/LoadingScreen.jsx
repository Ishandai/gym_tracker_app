import logo from "../assets/gym-logo.svg";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src={logo} alt="Gym Tracker" className="loading-logo" />
      <p>Gym Tracker</p>
      <div className="spinner" />
    </div>
  );
}
