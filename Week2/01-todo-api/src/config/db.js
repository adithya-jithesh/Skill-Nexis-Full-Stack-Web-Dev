import mongoose from "mongoose";

// Opens the one connection the whole app shares. Mongoose keeps it open and
// reuses it, so this is called once when the server starts.
export async function connectDB(uri) {
  const connection = await mongoose.connect(uri);
  console.log("MongoDB connected:", connection.connection.host + "/" + connection.connection.name);
  return connection;
}
