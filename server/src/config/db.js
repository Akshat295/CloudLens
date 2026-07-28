const dns = require("dns");
const mongoose = require("mongoose");

// mongodb+srv:// URIs are resolved via DNS SRV lookups through Node's own
// resolver. On networks where the configured DNS server doesn't handle that
// well (seen here as ECONNREFUSED against a local/VPN resolver), point Node
// at public resolvers so the SRV lookup succeeds even though the OS resolver
// already works fine.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
