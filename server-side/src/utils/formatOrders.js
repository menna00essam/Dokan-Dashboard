const { getImageUrlsByIds } = require("../controllers/gallery.controller");

const formatOrders = async (orders) => {
    return await Promise.all(
        orders.map(async (order) => {
            let totalAmount = 0;

            order.orderItems?.forEach((item) => {
                const price = item.productId?.price || 0;

                item.selectedColors?.forEach((color) => {
                    const quantity = color.quantity || 0;
                    totalAmount += price * quantity;
                });
            });

            const formattedOrderItems = await Promise.all(
                order.orderItems?.map(async (item) => {
                    const colors = item.productId?.colors || [];
                    const selectedColors = await Promise.all(
                        item.selectedColors.map(async (selectedColor) => {
                            const colorData = colors.find((c) => c.name === selectedColor.colorName);

                            const imageIds = colorData?.images || [];

                            const imageUrls = await getImageUrlsByIds(imageIds);

                            return {
                                colorName: selectedColor.colorName,
                                quantity: selectedColor.quantity,
                                images: imageUrls,
                            };
                        })
                    );

                    return {
                        productId: item.productId?._id,
                        name: item.productId?.name || "Name",
                        price: item.productId?.price || 0,
                        brand: item.productId?.brand || "Brand",
                        selectedColors: selectedColors
                    };
                }) || []
            );

            console.log("Formatted Order Items:", formattedOrderItems[0].selectedColors);

            return {
                _id: order._id,
                user: {
                    id: order.userId?._id,
                    firstName: order.userId?.firstName,
                    lastName: order.userId?.lastName,
                    email: order.userId?.email,
                    mobile: order.userId?.mobile || "",
                    avatar:
                        order.userId?.avatar ||
                        "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
                    addresses:
                        order.userId?.addresses.map((address) => ({
                            province: address.province || "Cairo",
                            city: address.city || "New Cairo",
                            street: address.street || "123 Ahmed Maher Street",
                            postalCode: address.postalCode || "",
                        })) || [],
                },
                orderNumber: order.orderNumber,
                status: order.status,
                total: totalAmount.toFixed(2),
                shippingMethod: {
                    name: order.shippingMethod?.name || "Cash on delivery",
                    cost: order.shippingMethod?.cost?.toFixed(2) || "0.00",
                },
                orderItems: formattedOrderItems,
                shippingAddress: {
                    companyName: order.shippingAddress?.companyName || "",
                    additionalInfo: order.shippingAddress?.additionalInfo || "",
                },
                transactionId: order.transactionId || "",
                previousStatus: order.previousStatus || "",
                createdAt: order.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
            };
        })
    )
};

module.exports = formatOrders;
