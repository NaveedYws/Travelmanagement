import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Product } from "@/lib/types";

export default function InquiryPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    api.get<{ products: Product[] }>(`/api/products/index.php?user_id=${userId}`)
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        toast.error("Failed to load products");
      });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a product/package");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/inquiries/index.php", {
        product_id: selectedProduct,
        customer_name: name.trim(),
        address: address.trim() || null,
        contact_no: contactNo.trim(),
        message: message.trim() || null,
      });
      setSubmitted(true);
      toast.success("Inquiry submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Inquiry Submitted!</h2>
            <p className="text-muted-foreground text-sm">Thank you for your interest. We'll get back to you soon.</p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setAddress(""); setContactNo(""); setMessage(""); setSelectedProduct(""); }}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Send Inquiry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inq-name">Your Name *</Label>
              <Input id="inq-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inq-contact">Contact Number *</Label>
              <Input id="inq-contact" value={contactNo} onChange={(e) => setContactNo(e.target.value)} required placeholder="+91 9876543210" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inq-address">Address</Label>
              <Input id="inq-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label>Product / Package / Room *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — ₹{p.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inq-msg">Message</Label>
              <Textarea id="inq-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any details..." rows={3} maxLength={500} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
