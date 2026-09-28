import { useEffect, useState } from "react";
import "./AdminPricing.css";

function AdminPricing() {
  const [settings, setSettings] = useState(null);
  const [feeType, setFeeType] = useState("fixed");
  const [feeValue, setFeeValue] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [deliveryCharge, setDeliveryCharge] =
    useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rules, setRules] = useState([]);
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleFeeType, setRuleFeeType] = useState("fixed");
  const [ruleFeeValue, setRuleFeeValue] = useState("");
  const [savingRule, setSavingRule] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  const fetchPricingSettings = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/pricing",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load pricing settings"
        );
        return;
      }

      const pricing = data.settings;

      setSettings(pricing || null);

      if (pricing) {
        setFeeType(
          pricing.fee_type || "fixed"
        );

        setFeeValue(
          pricing.fee_value ?? ""
        );

        setMinPrice(
          pricing.min_seller_price ?? ""
        );

        setMaxPrice(
          pricing.max_seller_price ?? ""
        );

        setDeliveryCharge(
          pricing.delivery_charge ?? ""
        );
      }

      setMessage("");
    } catch (error) {
      console.error(
        "Pricing settings error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingSettings();
    fetchPricingRules();
    fetchAllCategories();
  }, []);

  const fetchPricingRules = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/pricing/rules",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error(
        "Pricing rules error:",
        error
      );
    }
  };

  const fetchAllCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/categories",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAllCategories(
          data.categories || []
        );
      }
    } catch (error) {
      console.error(
        "Categories error:",
        error
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (feeValue === "") {
      setMessage("Fee value is required");
      return;
    }

    const numericFee = Number(feeValue);

    if (
      Number.isNaN(numericFee) ||
      numericFee < 0
    ) {
      setMessage(
        "Fee value must be a valid non-negative number"
      );
      return;
    }

    if (
      feeType !== "fixed" &&
      feeType !== "percentage"
    ) {
      setMessage("Invalid fee type");
      return;
    }

    if (
      feeType === "percentage" &&
      numericFee > 100
    ) {
      setMessage(
        "Percentage fee cannot be greater than 100"
      );
      return;
    }

    const minValue =
      minPrice === "" ? null : Number(minPrice);
    const maxValue =
      maxPrice === "" ? null : Number(maxPrice);
    const deliveryValue =
      deliveryCharge === ""
        ? null
        : Number(deliveryCharge);

    if (
      (minValue !== null &&
        (Number.isNaN(minValue) ||
          minValue < 0)) ||
      (maxValue !== null &&
        (Number.isNaN(maxValue) ||
          maxValue < 0))
    ) {
      setMessage(
        "Min/max price must be valid non-negative numbers"
      );
      return;
    }

    if (
      minValue !== null &&
      maxValue !== null &&
      minValue > maxValue
    ) {
      setMessage(
        "Minimum price cannot be greater than maximum price"
      );
      return;
    }

    if (
      deliveryValue !== null &&
      (Number.isNaN(deliveryValue) ||
        deliveryValue < 0)
    ) {
      setMessage(
        "Delivery charge must be a valid non-negative number"
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/admin/pricing",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fee_type: feeType,
            fee_value: numericFee,
            min_seller_price: minValue,
            max_seller_price: maxValue,
            delivery_charge: deliveryValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update pricing"
        );
        return;
      }

      setMessage(
        "Pricing settings updated successfully."
      );

      setSettings(
        data.settings || {
          fee_type: feeType,
          fee_value: numericFee,
        }
      );

      await fetchPricingSettings();
    } catch (error) {
      console.error(
        "Update pricing error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (!ruleCategory) {
      setMessage(
        "Choose a category for the rule"
      );
      return;
    }

    const numericRuleFee = Number(
      ruleFeeValue
    );

    if (
      ruleFeeValue === "" ||
      Number.isNaN(numericRuleFee) ||
      numericRuleFee < 0
    ) {
      setMessage(
        "Rule fee must be a valid non-negative number"
      );
      return;
    }

    if (
      ruleFeeType === "percentage" &&
      numericRuleFee > 100
    ) {
      setMessage(
        "Percentage fee cannot be greater than 100"
      );
      return;
    }

    try {
      setSavingRule(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/admin/pricing/rules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: ruleCategory,
            fee_type: ruleFeeType,
            fee_value: numericRuleFee,
            is_active: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to save category rule"
        );
        return;
      }

      setMessage(
        "Category pricing rule saved successfully."
      );

      setRuleCategory("");
      setRuleFeeValue("");

      await fetchPricingRules();
    } catch (error) {
      console.error(
        "Save rule error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRule = async (rule) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/pricing/rules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: rule.category,
            fee_type: rule.fee_type,
            fee_value: Number(rule.fee_value),
            is_active: !rule.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update rule"
        );
        return;
      }

      await fetchPricingRules();
    } catch (error) {
      console.error(
        "Toggle rule error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  const handleDeleteRule = async (rule) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (
      !window.confirm(
        `Delete the pricing rule for "${rule.category}"? Its books fall back to the global fee.`
      )
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/pricing/rules/${rule.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to delete rule"
        );
        return;
      }

      setMessage(
        "Category pricing rule deleted successfully."
      );

      await fetchPricingRules();
    } catch (error) {
      console.error(
        "Delete rule error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  const calculateExample = () => {
    const sellerPrice = 100;

    const numericFee =
      Number(feeValue) || 0;

    const numericDelivery =
      Number(deliveryCharge) || 0;

    const fee =
      feeType === "percentage"
        ? (sellerPrice * numericFee) / 100
        : numericFee;

    return sellerPrice + fee + numericDelivery;
  };

  const exampleFee =
    Number(feeValue) || 0;

  const exampleBuyerPrice =
    calculateExample();

  return (
    <main className="admin-pricing-page">

      {/* Background Animation */}
      <div className="pricing-bg pricing-bg-one"></div>
      <div className="pricing-bg pricing-bg-two"></div>
      <div className="pricing-bg pricing-bg-three"></div>

      {/* Header */}
      <section className="pricing-header">

        <div className="pricing-header-icon">
          💰
        </div>

        <div>
          <p className="pricing-label">
            ADMIN CONTROL CENTER
          </p>

          <h1>
            Pricing <span>Settings</span>
          </h1>

          <p className="pricing-description">
            Configure the platform fee added
            to the seller price.
          </p>
        </div>

      </section>

      {/* Message */}
      {message && (
        <div
          className={`pricing-message ${
            message.includes("successfully")
              ? "pricing-success"
              : "pricing-error"
          }`}
        >
          <span>
            {message.includes("successfully")
              ? "✅"
              : "⚠️"}
          </span>

          {message}
        </div>
      )}

      {loading ? (

        /* Loading */
        <section className="pricing-loading">

          <div className="pricing-loader">
            💰
          </div>

          <h2>
            Loading Pricing Settings...
          </h2>

          <p>
            Fetching current platform pricing
          </p>

        </section>

      ) : (

        <>

          {/* Main Pricing Layout */}
          <section className="pricing-layout">

            {/* Settings Form */}
            <div className="pricing-settings-card">

              <div className="pricing-card-heading">

                <div className="pricing-card-icon">
                  ⚙️
                </div>

                <div>
                  <span>
                    PLATFORM CONFIGURATION
                  </span>

                  <h2>
                    Platform Fee
                  </h2>
                </div>

              </div>

              <p className="pricing-card-description">
                Choose how much extra amount
                will be added to the seller price.
              </p>

              <form
                className="pricing-form"
                onSubmit={handleSubmit}
              >

                {/* Fee Type */}
                <div className="pricing-field">

                  <label htmlFor="fee-type">
                    Fee Type
                  </label>

                  <div className="pricing-select-wrapper">
                    <span>📊</span>

                    <select
                      id="fee-type"
                      value={feeType}
                      onChange={(e) =>
                        setFeeType(
                          e.target.value
                        )
                      }
                    >
                      <option value="fixed">
                        Fixed Amount
                      </option>

                      <option value="percentage">
                        Percentage
                      </option>
                    </select>
                  </div>

                </div>

                {/* Fee Value */}
                <div className="pricing-field">

                  <label htmlFor="fee-value">
                    Fee Value
                  </label>

                  <div className="pricing-input-wrapper">

                    <span>
                      {feeType ===
                      "percentage"
                        ? "%"
                        : "₹"}
                    </span>

                    <input
                      id="fee-value"
                      type="number"
                      min="0"
                      max={
                        feeType ===
                        "percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      value={feeValue}
                      onChange={(e) =>
                        setFeeValue(
                          e.target.value
                        )
                      }
                      placeholder={
                        feeType ===
                        "percentage"
                          ? "Example: 10"
                          : "Example: 20"
                      }
                      required
                    />

                  </div>

                  <small>
                    {feeType ===
                    "percentage"
                      ? "Enter a value from 0% to 100%."
                      : "Enter a fixed amount in Indian Rupees."}
                  </small>

                </div>

                {/* Min / Max seller price limits */}
                <div className="pricing-limits-row">

                  <div className="pricing-field">

                    <label htmlFor="min-price">
                      Min Seller Price (₹)
                    </label>

                    <div className="pricing-input-wrapper">

                      <span>₹</span>

                      <input
                        id="min-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value
                          )
                        }
                        placeholder="No minimum"
                      />

                    </div>

                  </div>

                  <div className="pricing-field">

                    <label htmlFor="max-price">
                      Max Seller Price (₹)
                    </label>

                    <div className="pricing-input-wrapper">

                      <span>₹</span>

                      <input
                        id="max-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value
                          )
                        }
                        placeholder="No maximum"
                      />

                    </div>

                  </div>

                </div>

                <small className="pricing-limits-hint">
                  Empty = no limit. Listings outside
                  this range are rejected.
                </small>

                {/* Delivery charge */}
                <div className="pricing-field">

                  <label htmlFor="delivery-charge">
                    Delivery Charge (₹)
                  </label>

                  <div className="pricing-input-wrapper">

                    <span>₹</span>

                    <input
                      id="delivery-charge"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCharge}
                      onChange={(e) =>
                        setDeliveryCharge(
                          e.target.value
                        )
                      }
                      placeholder="Example: 40"
                    />

                  </div>

                  <small>
                    Flat delivery fee added to every
                    order. Empty = free delivery.
                  </small>

                </div>

                {/* Save */}
                <button
                  type="submit"
                  className="save-pricing-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      💾 Save Pricing
                    </>
                  )}
                </button>

              </form>

            </div>

            {/* Live Preview */}
            <div className="pricing-preview-card">

              <div className="preview-top">

                <div className="preview-icon">
                  🧮
                </div>

                <div>
                  <span>
                    LIVE PREVIEW
                  </span>

                  <h2>
                    Price Calculation
                  </h2>
                </div>

              </div>

              <div className="calculation-box">

                <div className="calculation-row">
                  <span>
                    Seller Price
                  </span>

                  <strong>
                    ₹100.00
                  </strong>
                </div>

                <div className="calculation-symbol">
                  +
                </div>

                <div className="calculation-row fee-row">
                  <span>
                    Platform Fee
                  </span>

                  <strong>
                    {feeType ===
                    "percentage"
                      ? `${exampleFee}%`
                      : `₹${exampleFee.toFixed(2)}`}
                  </strong>
                </div>

                <div className="calculation-row">
                  <span>
                    Delivery Charge
                  </span>

                  <strong>
                    ₹
                    {(
                      Number(
                        deliveryCharge
                      ) || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="calculation-line"></div>

                <div className="calculation-row final-row">
                  <span>
                    Buyer Price
                  </span>

                  <strong>
                    ₹
                    {exampleBuyerPrice.toFixed(
                      2
                    )}
                  </strong>
                </div>

              </div>

              <div className="pricing-formula">

                <span>FORMULA</span>

                <p>
                  Seller Price + Platform Fee +
                  Delivery Charge = Buyer Price
                </p>

              </div>

              <div className="preview-note">
                💡 This example uses a seller
                price of ₹100.
              </div>

            </div>

          </section>

          {/* Current Settings */}
          <section className="current-pricing-section">

            <div className="current-pricing-heading">

              <div>
                <span>
                  ACTIVE CONFIGURATION
                </span>

                <h2>
                  📋 Current Settings
                </h2>
              </div>

              <div className="active-badge">
                ● ACTIVE
              </div>

            </div>

            {settings ? (

              <div className="current-pricing-grid">

                <div className="current-pricing-item">

                  <div className="current-icon">
                    📊
                  </div>

                  <div>
                    <p>
                      Fee Type
                    </p>

                    <strong>
                      {settings.fee_type ===
                      "percentage"
                        ? "Percentage"
                        : "Fixed Amount"}
                    </strong>
                  </div>

                </div>

                <div className="current-pricing-item">

                  <div className="current-icon">
                    💰
                  </div>

                  <div>
                    <p>
                      Fee Value
                    </p>

                    <strong>
                      {settings.fee_type ===
                      "percentage"
                        ? `${settings.fee_value}%`
                        : `₹${settings.fee_value}`}
                    </strong>
                  </div>

                </div>

                <div className="current-pricing-item">

                  <div className="current-icon">
                    🚚
                  </div>

                  <div>
                    <p>
                      Delivery Charge
                    </p>

                    <strong>
                      {settings.delivery_charge ===
                        null ||
                      settings.delivery_charge ===
                        undefined
                        ? "FREE"
                        : `₹${settings.delivery_charge}`}
                    </strong>
                  </div>

                </div>

                <div className="current-pricing-item">

                  <div className="current-icon">
                    🧮
                  </div>

                  <div>
                    <p>
                      Example Buyer Price
                    </p>

                    <strong>
                      ₹
                      {(() => {
                        const value =
                          Number(
                            settings.fee_value
                          ) || 0;

                        const delivery =
                          Number(
                            settings.delivery_charge
                          ) || 0;

                        const fee =
                          settings.fee_type ===
                          "percentage"
                            ? (100 * value) /
                              100
                            : value;

                        return (
                          100 +
                          fee +
                          delivery
                        ).toFixed(2);
                      })()}
                    </strong>
                  </div>

                </div>

                {settings.updated_at && (
                  <div className="current-pricing-item">

                    <div className="current-icon">
                      🕒
                    </div>

                    <div>
                      <p>
                        Last Updated
                      </p>

                      <strong>
                        {new Date(
                          settings.updated_at
                        ).toLocaleString()}
                      </strong>
                    </div>

                  </div>
                )}

              </div>

            ) : (

              <div className="no-pricing-settings">
                <span>⚙️</span>

                <h3>
                  No Pricing Settings Found
                </h3>

                <p>
                  Save a pricing configuration
                  to create the active settings.
                </p>
              </div>

            )}

          </section>

          {/* Category-wise pricing rules */}
          <section className="pricing-rules-section">

            <div className="current-pricing-heading">

              <div>
                <span>
                  CATEGORY OVERRIDES
                </span>

                <h2>
                  🏷️ Category Pricing Rules
                </h2>
              </div>

            </div>

            <p className="pricing-card-description">
              A category rule overrides the
              global fee for that category.
              Inactive rules and categories
              without rules use the global fee.
            </p>

            <form
              className="pricing-rule-form"
              onSubmit={handleSaveRule}
            >

              <select
                value={ruleCategory}
                onChange={(e) =>
                  setRuleCategory(
                    e.target.value
                  )
                }
                required
              >
                <option value="" disabled>
                  Choose category
                </option>

                {allCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

              <select
                value={ruleFeeType}
                onChange={(e) =>
                  setRuleFeeType(
                    e.target.value
                  )
                }
              >
                <option value="fixed">
                  Fixed ₹
                </option>

                <option value="percentage">
                  Percentage %
                </option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Fee value"
                value={ruleFeeValue}
                onChange={(e) =>
                  setRuleFeeValue(
                    e.target.value
                  )
                }
                required
              />

              <button
                type="submit"
                className="save-pricing-button"
                disabled={savingRule}
              >
                {savingRule
                  ? "Saving..."
                  : "➕ Save Rule"}
              </button>

            </form>

            {rules.length === 0 ? (
              <p className="pricing-rules-empty">
                No category rules yet — every
                category uses the global fee.
              </p>
            ) : (
              <div className="pricing-rules-table-wrapper">
                <table className="pricing-rules-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <strong>
                            {rule.category}
                          </strong>
                        </td>

                        <td>
                          {rule.fee_type ===
                          "percentage"
                            ? `${rule.fee_value}%`
                            : `₹${rule.fee_value}`}
                        </td>

                        <td>
                          {rule.is_active
                            ? "✅ Active"
                            : "⏸️ Inactive"}
                        </td>

                        <td>
                          <div className="pricing-rule-actions">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleRule(
                                  rule
                                )
                              }
                            >
                              {rule.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="pricing-rule-delete"
                              onClick={() =>
                                handleDeleteRule(
                                  rule
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>

          {/* Information */}
          <section className="pricing-info">

            <div className="pricing-info-icon">
              💡
            </div>

            <div>
              <h3>
                How Pricing Works
              </h3>

              <p>
                The seller sets the original
                book price. The configured
                platform fee plus delivery
                charge is then added to
                calculate the buyer price.
              </p>
            </div>

          </section>

          {/* Footer */}
          <section className="pricing-footer">

            <div className="pricing-footer-icon">
              💰
            </div>

            <div>
              <h2>
                USED BOOK MARKET
              </h2>

              <p>
                Pricing management control panel
              </p>
            </div>

            <div className="pricing-footer-status">
              <span></span>
              System Online
            </div>

          </section>

        </>
      )}

    </main>
  );
}

export default AdminPricing;