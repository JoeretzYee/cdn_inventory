import React from "react";
import "../css/Jumbotron.css";

function Jumbotron() {
  return (
    <div
      className="p-5 mb-4"
      style={{
        position: "relative", // To position the pseudo-element relative to this container
        color: "white",
        borderRadius: "0.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: 'url("/cdn_school.jpg")', // Local image
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3, // Adjust opacity of the image
          zIndex: -1, // Put the image behind the content
        }}
      ></div>

      <div
        className="py-5"
        style={{
          backgroundColor: "rgba(125, 60, 152, 0.7)",
          borderRadius: "0.5rem",
          display: "inline-block",
          padding: "20px",
        }}
      >
        <h1 className="display-5 fw-bold">NALGEU Canteen Inventory</h1>
      </div>
    </div>
  );
}

export default Jumbotron;
