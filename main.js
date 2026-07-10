const btns = document.querySelectorAll("#theme-toggle, #theme-toggle-fixed");

const update = () => {
  document.body.classList.toggle("light");
  document.body.classList.toggle(
    "dark",
    !document.body.classList.contains("light")
  );
};

btns.forEach((btn) => btn.addEventListener("click", update));
window.onresize = update;

let registeredCredential = null;
const createBtn = document.getElementById("create-passkey");
const getBtn = document.getElementById("get-passkey");
const status = document.getElementById("auth-status");
const debug = document.getElementById("auth-debug");

const log = (...args) => {
  status.textContent = args[0] || "...";
  debug.textContent = JSON.stringify(
    { t: new Date().toLocaleTimeString(), ...args },
    null,
    2
  );
};

const challenge = new TextEncoder().encode(crypto.randomUUID());
const rpId = window.location.hostname || "localhost";

createBtn.addEventListener("click", async () => {
  try {
    log("Calling navigator.credentials.create", { id: "create-passkey" });
    const options = {
      publicKey: {
        challenge,
        rp: { name: "Pulse Demo", id: rpId },
        user: {
          id: crypto.randomUUID(),
          name: "demo_user",
          displayName: "Demo User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 } /* ES256 */,
          { type: "public-key", alg: -257 } /* Ed25519 */,
          { type: "public-key", alg: -263 } /* ES384 */,
        ],
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      },
    };

    const credential = await navigator.credentials.create(options);
    registeredCredential = credential;
    log("Passkey created! ID:", credential.id.slice(0, 16), "...");
    getBtn.disabled = false;
    getBtn.classList.remove("opacity-40", "cursor-not-allowed");
  } catch (e) {
    const msg =
      e.name === "NotAllowedError" && window.location.protocol === "file:"
        ? "WebAuthn is disabled over file://. Use HTTPS/localhost."
        : e.message;
    log("Error:", msg);
    createBtn.disabled = false;
    createBtn.classList.remove("opacity-40");
  }
});

getBtn.addEventListener("click", async () => {
  try {
    log("Calling navigator.credentials.get");
    const options = {
      publicKey: {
        challenge,
        rpId,
        allowCredentials: [
          { id: registeredCredential?.id, type: "public-key" },
        ],
        userVerification: "preferred",
      },
    };
    const result = await navigator.credentials.get(options);
    log("Verified credential:", result?.id?.slice(0, 16), "...");
  } catch (e) {
    log("Replay error:", e.message);
  }
});
