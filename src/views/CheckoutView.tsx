import { useCartStore } from '../store/cartStore';

export default function CheckoutView() {
  const { items, clearCart } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Receipt preview</h2>
      <pre className="bg-white p-4 border rounded-md">
        {items.map((i) => `${i.name} x${i.quantity}  €${(i.price * i.quantity).toFixed(2)}`).join('\n')}
        {'\n'}---------------------------{'\n'}
        Total: €{total.toFixed(2)}
      </pre>
      <button
        onClick={clearCart}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        Print receipt
      </button>
    </div>
  );
}
