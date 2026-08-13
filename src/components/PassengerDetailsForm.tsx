import React from 'react';
import { Input } from './UIComponents';

interface PassengerDetailsFormProps {
  details: any;
  setDetails: (details: any) => void;
  disabled?: boolean;
}

export const PassengerDetailsForm: React.FC<PassengerDetailsFormProps> = ({ details, setDetails, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Title"
        name="title"
        value={details.title || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="First Name"
        name="firstName"
        value={details.firstName || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Last Name"
        name="lastName"
        value={details.lastName || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Gender"
        name="gender"
        value={details.gender || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Nationality"
        name="nationality"
        value={details.nationality || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Date of Birth"
        name="dob"
        type="date"
        value={details.dob || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Passport/NIC No."
        name="passportNo"
        value={details.passportNo || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Document Expiry"
        name="documentExpiry"
        type="date"
        value={details.documentExpiry || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Frequent Flyer"
        name="frequentFlyer"
        value={details.frequentFlyer || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Wheelchair"
        name="wheelchair"
        value={details.wheelchair || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Meal"
        name="meal"
        value={details.meal || ""}
        onChange={handleChange}
        disabled={disabled}
      />
      <Input
        label="Phone"
        name="phone"
        value={details.phone || ""}
        onChange={handleChange}
        disabled={disabled}
        required
      />
      <Input
        label="Reference"
        name="reference"
        value={details.reference || ""}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
};
