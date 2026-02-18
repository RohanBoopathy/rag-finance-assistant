const InputField = ({ name, label, value, placeholder, type="text", disabled }: FormInputProps) => {
  return (
    <>
      <label className="text-sm font-medium" htmlFor={name}> {label} </label>

      <input 
        className="h-12 w-full px-3 py-3 bg-white text-black placeholder:text-gray-400 rounded-lg focus:border-yellow-500! focus:ring-0"
        id={name}
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
      />
    </>
  )
}

export default InputField