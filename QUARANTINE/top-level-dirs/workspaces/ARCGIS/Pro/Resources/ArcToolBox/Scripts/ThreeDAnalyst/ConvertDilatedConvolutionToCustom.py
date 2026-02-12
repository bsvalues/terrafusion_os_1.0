import torch
from torch import nn
import torch.nn.functional as F

def has_tensor_cores(device):
    """
    Check if a specific GPU has tensor cores based on its compute capability.

    Args:
        device: The device to check for tensor cores (torch.device, str, or int).

    Returns:
        bool: True if the GPU has tensor cores, False otherwise.
    """
    # Convert device to torch.device if it's not already.
    if not isinstance(device, torch.device):
        device = torch.device(f"cuda:{device}" if isinstance(device, int) else device)

    # Check if the device is CPU.
    if device.type == "cpu":
        return True
    
    # Get the compute capability of the specified GPU.
    major, minor = torch.cuda.get_device_capability(device)
    
    # Determine if tensor cores are available (compute capability 7.0 or higher).
    return 7 <= major

class CustomDilatedConv(nn.Module):
    def __init__(self, conv_layer, device):
        super(CustomDilatedConv, self).__init__()

        # Assertions to ensure assumptions are met.
        assert any(1 < dilation for dilation in conv_layer.dilation), "Only dilated convolutions are supported."
        assert all(k % 2 == 1 for k in conv_layer.kernel_size), "Only odd kernel sizes are supported."
        assert all(s == 1 for s in conv_layer.stride), "Only stride 1 is supported."

        # Extract parameters from the provided convolutional layer.
        self.in_channels = conv_layer.in_channels
        self.out_channels = conv_layer.out_channels
        self.kernel_size = conv_layer.kernel_size
        self.padding = conv_layer.padding
        self.dilation = conv_layer.dilation

        # Initialize the convolution layer and move it to the specified device.
        self.conv = nn.Conv2d(self.in_channels, self.out_channels, self.kernel_size, bias = False).to(device)
        
        self.conv.weight.data = conv_layer.weight.data.clone() # Copy weights from the provided layer.

    def forward(self, x):
        # Pad the input tensor to handle dilation.
        x_padded = F.pad(x, (self.padding[1], self.padding[1], self.padding[0], self.padding[0]))

        # Calculate output dimensions
        N, C, H, W = x.size()
        out_width = W + 2 * self.padding[1] - self.dilation[1] * (self.kernel_size[1] - 1)
        out_height = H + 2 * self.padding[0] - self.dilation[0] * (self.kernel_size[0] - 1)

        # Initialize output tensor with the calculated dimensions
        out = torch.zeros((N, self.out_channels, out_height, out_width), device=x.device, dtype=x.dtype)

        for i in range(self.dilation[1]):
            for j in range(self.dilation[0]):
                # Subsample the input.
                x_sub = x_padded[:, :, j::self.dilation[0], i::self.dilation[1]]

                # Apply convolution.
                out_sub = self.conv(x_sub)

                # Place back into output tensor, ensuring dimensions align.
                out[:, :, j::self.dilation[0], i::self.dilation[1]] += out_sub

        return out

def convert_dilated_convs_to_custom(model, device):
    """
    Convert all Conv2d layers with dilation > 1 to CustomDilatedConv layers in a given model.

    Args:
        model: The model to convert (nn.Module).
        device: The device where the model is loaded (torch.device, str, or int).
        diagnostics_file: The file to log diagnostics information.

    Returns:
        int: The total number of layers replaced.
    """
    for name, module in model.named_children():
        if isinstance(module, nn.Conv2d) and any(1 < d for d in module.dilation):
            setattr(model, name, CustomDilatedConv(module, device))
        elif isinstance(module, nn.Module):
            # Recurse into child modules.
            convert_dilated_convs_to_custom(module, device)
