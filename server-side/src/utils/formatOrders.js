const formatOrders = (orders) => {
    return orders.map((order) => {
        let totalAmount = 0;

        order.orderItems?.forEach((item) => {
            const price = item.productId?.price || 0;

            item.selectedColors?.forEach((color) => {
                const quantity = color.quantity || 0;
                totalAmount += price * quantity;
            });
        });
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
            orderItems:
                order.orderItems?.map((item) => {
                    const colors = item.productId?.colors || [];
                    const defaultImage = item.productId?.image || "https://www.w3schools.com/w3images/lights.jpg";

                    const selectedColors = item.selectedColors.map((color) => {
                        const colorData = colors.find((c) => c.name === color.colorName);
                        const imageUrl = colorData?.images?.[0]?.url || defaultImage;

                        return {
                            colorName: color.colorName,
                            quantity: color.quantity,
                            image: imageUrl,
                        };
                    });
                    return {
                        productId: item.productId?._id,
                        name: item.productId?.name || "",
                        price: item.productId?.price || 0,
                        brand: item.productId?.brand || "",
                        selectedColors,
                        image: defaultImage,
                    };
                }) || [],
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
    });
};

module.exports = formatOrders;

