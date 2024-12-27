import "./App.css";
import Jumbotron from "./components/Jumbotron";
import Tabs from "./components/Tabs";

function App() {
  return (
    <div className="App">
      <Jumbotron />
      <div className="container-fluid">
        <Tabs />
      </div>
    </div>
  );
}

export default App;
