import express from "express";
import axios from "axios";
const router = express.Router();

router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: { lat, lon, format: "json" },
        headers: { "User-Agent": "Plate2DoorApp/1.0" },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Reverse geocoding error:", err.message);
    res.status(500).json({ error: "Failed to reverse geocode" });
  }
});

export default router;
