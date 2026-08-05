import { ProductService } from "@reusedo/api-client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@reusedo/ui";
import { type Category, type CreateProductData, createProductSchema } from "@reusedo/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
// For this milestone, we use React Hook Form without the full form components
// just to keep it self-contained if standard ones aren't available
import { useForm as useRHForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ProductService.getCategories,
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => ProductService.getProductById(id as string),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useRHForm<CreateProductData>({
    // biome-ignore lint/suspicious/noExplicitAny: Required for ZodResolver
    resolver: zodResolver(createProductSchema as any),
    defaultValues: {
      tags: [],
      images: [],
    },
  });

  useEffect(() => {
    if (product && isEditing) {
      setValue("title", product.title);
      setValue("description", product.description);
      setValue("category_id", product.category_id);
      setValue("condition", product.condition);
      setValue("exchange_preference", product.exchange_preference);
      setValue("district", product.district);
      setValue("upazila", product.upazila);
      setValue("brand", product.brand || "");
      setValue("model", product.model || "");
      setValue("color", product.color || "");
      if (product.purchase_year) setValue("purchase_year", product.purchase_year);
      if (product.estimated_value) setValue("estimated_value", product.estimated_value);

      setImageUrls(product.images || []);
      setValue("images", product.images || []);
    }
  }, [product, isEditing, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductData & { status: string }) =>
      ProductService.createProduct(data, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      navigate("/my-products");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductData) => ProductService.updateProduct(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      navigate("/my-products");
    },
  });

  const onSubmit = async (data: CreateProductData, status: "draft" | "published") => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync({ ...data, status });
      }
    } catch (error) {
      console.error("Failed to save product", error);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      const newImages = [...imageUrls, newImageUrl];
      setImageUrls(newImages);
      setValue("images", newImages, { shouldValidate: true });
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (url: string) => {
    const newImages = imageUrls.filter((i) => i !== url);
    setImageUrls(newImages);
    setValue("images", newImages, { shouldValidate: true });
  };

  if (isEditing && productLoading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{isEditing ? "Edit Product" : "List a New Item"}</h1>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us about the item you want to list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="e.g. iPhone 13 Pro 128GB" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the item's condition, features, and why you are exchanging it..."
                className="min-h-[120px]"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={watch("category_id") || ""}
                  onChange={(e) =>
                    setValue("category_id", e.target.value, { shouldValidate: true })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories?.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">{errors.category_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Condition *</Label>
                <select
                  value={watch("condition") || ""}
                  onChange={(e) => setValue("condition", e.target.value, { shouldValidate: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select condition
                  </option>
                  <option value="Brand New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Repair">Needs Repair</option>
                </select>
                {errors.condition && (
                  <p className="text-sm text-destructive">{errors.condition.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchange Details & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="exchange_preference">What are you looking for in exchange? *</Label>
              <Input
                id="exchange_preference"
                placeholder="e.g. Any Android phone, Books, or Open to offers"
                {...register("exchange_preference")}
              />
              {errors.exchange_preference && (
                <p className="text-sm text-destructive">{errors.exchange_preference.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input id="district" placeholder="e.g. Dhaka" {...register("district")} />
                {errors.district && (
                  <p className="text-sm text-destructive">{errors.district.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="upazila">Upazila / Area *</Label>
                <Input id="upazila" placeholder="e.g. Gulshan" {...register("upazila")} />
                {errors.upazila && (
                  <p className="text-sm text-destructive">{errors.upazila.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Add URL links to your product images. (Direct upload coming soon).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <Button type="button" onClick={handleAddImage} variant="secondary">
                Add
              </Button>
            </div>
            {errors.images && <p className="text-sm text-destructive">{errors.images.message}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className="relative aspect-square bg-muted rounded-lg border overflow-hidden group"
                >
                  <img
                    loading="lazy"
                    src={url}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {imageUrls.length === 0 && (
                <div className="aspect-square bg-muted rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground col-span-2 md:col-span-1">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">No images added</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit((d) => onSubmit(d, "draft"))}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit((d) => onSubmit(d, "published"))}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
