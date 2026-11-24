export const ErrorMsg = ({ msg }: { msg: string }) => msg ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p> : null;
export const OkMsg = ({ msg }: { msg: string }) => msg ? <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</p> : null;
export const Empty = ({ text }: { text: string }) => <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">{text}</p>;
