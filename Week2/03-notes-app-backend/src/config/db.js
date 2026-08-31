import mongoose from "mongoose";

// One shared connection, opened when the server starts.
export async function connectDB(uri) {
  const connection = await mongoose.connect(uri);
  console.log("MongoDB connected:", connection.connection.host + "/" + connection.connection.name);
  return connection;
}
