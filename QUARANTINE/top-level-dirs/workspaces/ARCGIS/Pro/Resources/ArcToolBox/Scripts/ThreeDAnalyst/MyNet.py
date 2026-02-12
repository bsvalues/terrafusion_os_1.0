import enum
import torch
import torch.nn as nn

class PDF_combining_mode(enum.Enum):
    MULTIPLICATION = enum.auto()
    COMBINE = enum.auto()

def str_to_pdf_combining_mode(s):
    try:
        return PDF_combining_mode[s.upper()]
    except KeyError:
        raise ValueError(f"Invalid mode: {s}")

class CustomConv2d(nn.Module):
    """A custom convolutional layer with batch normalization and ReLU activation."""
    def __init__(self, in_channels, out_channels, kernel_radius = 0, dilation = 1):
        super(CustomConv2d, self).__init__()

        kernel_size = 2 * kernel_radius + 1

        # Define convolutional layer with the specified kernel size, stride, and padding.
        self.conv_layer = nn.Conv2d(in_channels, out_channels, kernel_size = kernel_size, stride = 1, padding = kernel_radius * dilation, dilation = dilation, bias = False)

        self.bn = nn.BatchNorm2d(out_channels)

        self.relu = nn.ReLU(inplace = True)

    def forward(self, input_tensor):
        # Apply convolutional layer to the input tensor.
        output_tensor = self.conv_layer(input_tensor)

        output_tensor = self.bn(output_tensor)

        return self.relu(output_tensor)

class CombiningLayer(nn.Module):
    """Combines multiple convolutional layers with a tanh activation for the control input."""
    def __init__(self, in_channels, layers_config):
        """
        Initialize the custom layer.
        :param in_channels: Number of input channels.
        :param layers_config: Configuration of each layer including channels, kernel_radius, and dilation.
        """
        super(CombiningLayer, self).__init__()

        self.layers = nn.ModuleList()
        current_in_channels = in_channels
        for layer_cfg in layers_config:
            layer = CustomConv2d(
                in_channels=current_in_channels,
                out_channels=layer_cfg['channels'],
                kernel_radius=layer_cfg['kernel_radius'],
                dilation=layer_cfg['dilation']
            )
            self.layers.append(layer)
            current_in_channels = layer_cfg['channels']

        # Add a final layer that maps back to the initial number of input channels.
        self.layers.append(CustomConv2d(in_channels = current_in_channels, out_channels = in_channels))

        # Tanh layer for the control.
        self.tanh = nn.Tanh()

    def forward(self, control_input, inputA, inputB):
        """
        Forward pass through the layer.
        :param control_input: The control input.
        :param inputA: Input A.
        :param inputB: Input B.
        :return: Weighted sum of inputA and inputB based on the control.
        """
        x = control_input
        for layer in self.layers:
            x = layer(x)

        # Apply tanh to the output of the last CNN layer.
        control = self.tanh(x)

        # Ensure that inputA and inputB have compatible dimensions with the control, ignoring the batch dimension.
        assert inputA.size()[1:] == control.size()[1:], f"inputA dimensions {inputA.size()[1:]} must match control dimensions {control.size()[1:]}"
        assert inputB.size()[1:] == control.size()[1:], f"inputB dimensions {inputB.size()[1:]} must match control dimensions {control.size()[1:]}"

        # Calculate the weighted sum.
        output = 0.5 * ((1.0 - control) * inputA + (1.0 + control) * inputB)

        return output

class MyPyramid(nn.Module):
    """Module combining progressive dilation fusion layers and a combining layer."""
    def __init__(self, in_channels, pdf_config, combining_layer_channels, combining_mode = PDF_combining_mode.MULTIPLICATION):
        """
        Initialize the MyPyramid module.
        :param in_channels: Number of input channels.
        :param pdf_config: Configuration of PDF layers including kernel_radius and dilation.
        :param combining_layer_channels: Number of channels for the combining layer.
        """
        super(MyPyramid, self).__init__()

        self.in_channels = in_channels
        self.combining_mode = combining_mode

        if combining_mode == PDF_combining_mode.MULTIPLICATION:
            # Initialize Progressive Dilation Fusion (PDF) layers based on the given configuration.
            self.pdf_layers = nn.ModuleList([
                CustomConv2d(
                    in_channels,
                    2 * in_channels, # Double the number of channels for each layer's output.
                    kernel_radius=config['kernel_radius'],
                    dilation=config['dilation']
                )
                for config in pdf_config
            ])

            # Initialize the combining layer.
            self.combining_layers = CombiningLayer(in_channels, combining_layer_channels)
        else:
            # Initialize Progressive Dilation Fusion (PDF) layers based on the given configuration.
            self.pdf_layers = nn.ModuleList([
                CustomConv2d(
                    in_channels,
                    in_channels,
                    kernel_radius=config['kernel_radius'],
                    dilation=config['dilation']
                )
                for config in pdf_config
            ])

            # Initialize the combining layer.
            self.combining_layers = nn.ModuleList([
                CustomConv2d(
                    2 * in_channels,
                    in_channels,
                    kernel_radius=0,
                    dilation=1
                )
                for _ in pdf_config
            ])

    def ensure_combining_mode(self):
        if not hasattr(self, 'combining_mode'):
            self.combining_mode = PDF_combining_mode.MULTIPLICATION  # Default value or appropriate handling

    def forward(self, x):
        """
        Forward pass through the MyPyramid module.
        :param x: Input tensor.
        :return: Output tensor after processing through PDF layers and combining layers.
        """

        if self.combining_mode == PDF_combining_mode.MULTIPLICATION:
            for layer in self.pdf_layers:
                # Pass the input through the current PDF layer.
                layer_output = layer(x)

                # Split the layer_output into control part and main part.
                # Assuming the control_output has the same number of channels as the input,
                # and main_output has the remaining channels.
                control_output, main_output = layer_output.split([self.in_channels, self.in_channels], dim=1)

                # Combine the control_output, the original input, and the main_output using the combining layer.
                x = self.combining_layers(control_output, x, main_output)
        else:
            for layer, combining_layer in zip(self.pdf_layers, self.combining_layers):
                # Pass the input through the current PDF layer and store the output.
                layer_output = layer(x)

                # Concatenate the output from the previous iteration (or initial input) with the current layer's output.
                combined = torch.cat((x, layer_output), dim=1)
                x = combining_layer(combined)

        return x  # Return the final output.

class Encoder(nn.Module):
    """Encoder module with multiple convolutional layers."""
    def __init__(self, in_channels, layers_config):
        super(Encoder, self).__init__()

        self.layers = nn.ModuleList()
        for layer_config in layers_config:
            out_channels = layer_config['channels']
            layer = nn.Sequential(
                CustomConv2d(in_channels, out_channels, kernel_radius = layer_config['kernel_radius'], dilation = layer_config['dilation']),
                CustomConv2d(out_channels, out_channels, kernel_radius = layer_config['kernel_radius'], dilation = layer_config['dilation'])
            )
            self.layers.append(layer)

            in_channels = out_channels

    def forward(self, x):
        skip_outputs = []
        for layer in self.layers:
            x = layer(x)
            skip_outputs.append(x)
        return x, skip_outputs

class Decoder(nn.Module):
    """Decoder module with multiple convolutional layers and skip connections."""
    def __init__(self, in_channels, layers_config, decoder_channels):
        super(Decoder, self).__init__()

        self.layers = nn.ModuleList()
        for idx in range(len(layers_config)):
            out_channels = layers_config[idx + 1]['channels'] if idx + 1 < len(layers_config) else decoder_channels
            layer = nn.Sequential(
                CustomConv2d(in_channels, out_channels, kernel_radius = layers_config[idx]['kernel_radius'], dilation = layers_config[idx]['dilation']),
                CustomConv2d(out_channels, out_channels, kernel_radius = layers_config[idx]['kernel_radius'], dilation = layers_config[idx]['dilation'])
            )
            self.layers.append(layer)

            in_channels = 2 * out_channels

    def forward(self, x, skip_outputs):
        for idx, layer in enumerate(self.layers):
            if idx != 0:
                x = torch.cat((x, skip_outputs[idx]), dim=1) # Concatenate skip connection.
            x = layer(x)
        return x

"""Main network class for object detection."""
class MyNet(nn.Module):
    def __init__(self, num_classes, input_channels, decoder_channels, layers_config, pdf_config, combining_channels, combining_mode = PDF_combining_mode.MULTIPLICATION):
        super(MyNet, self).__init__()
        self.encoder = Encoder(input_channels, layers_config)
        self.my_pyramid = MyPyramid(layers_config[-1]['channels'], pdf_config, combining_channels, combining_mode)
        self.decoder = Decoder(layers_config[-1]['channels'], layers_config[::-1], decoder_channels) # Reverse the layers_config for the decoder.
        self.final_conv = nn.Conv2d(decoder_channels, num_classes, kernel_size = 1, stride = 1)
        self.sigmoid = nn.Sigmoid()

    def ensure_combining_mode(self):
        self.my_pyramid.ensure_combining_mode()

    def forward(self, x):
        x, skip_outputs = self.encoder(x)
        x = self.my_pyramid(x)
        x = self.decoder(x, skip_outputs[::-1])
        x = self.final_conv(x)
        x = self.sigmoid(x) # Apply sigmoid activation to the final output.
        return x

    def count_parameters(self):
        """Count the number of trainable parameters in each part of the model and the total number."""

        # Counting parameters in each part.
        encoder_params = sum(p.numel() for p in self.encoder.parameters() if p.requires_grad) # Count parameters in the encoder.
        pdf_params = sum(p.numel() for p in self.my_pyramid.parameters() if p.requires_grad) # Count parameters in the pdf.
        decoder_params = sum(p.numel() for p in self.decoder.parameters() if p.requires_grad) # Count parameters in the decoder.
        final_conv_params = sum(p.numel() for p in self.final_conv.parameters() if p.requires_grad) # Count parameters in the final_conv.

        # Calculating total parameters.
        total_params = encoder_params + pdf_params + decoder_params + final_conv_params # Sum parameters from all parts for total.

        # Returning individual and total parameters.
        return {
                'encoder': encoder_params,
                'pdf': pdf_params,
                'decoder': decoder_params,
                'final_conv': final_conv_params,
                'total': total_params # Add total parameters to the returned dictionary.
               }

# Testing the implementation
if False and __name__ == "__main__":
    input_channels = 3 # Number of input channels (e.g., 3 for RGB images)
    decoder_channels = 32 # Number of output channels for the decoder
    num_classes = 2 # Number of classes for the output

    layers_config = [
        {'channels' : 32, 'kernel_radius': 1, 'dilation': 1},
        {'channels' : 64, 'kernel_radius': 1, 'dilation': 1},
        {'channels' : 128, 'kernel_radius': 1, 'dilation': 1},
    ]

    pdf_config = [
        {'kernel_radius': 3, 'dilation': 1},
        {'kernel_radius': 3, 'dilation': 3},
        {'kernel_radius': 3, 'dilation': 7},
        {'kernel_radius': 3, 'dilation': 15},
        {'kernel_radius': 3, 'dilation': 31},
    ]

    combining_channels = [
        {'channels' : 32, 'kernel_radius': 3, 'dilation': 1},
        {'channels' : 16, 'kernel_radius': 3, 'dilation': 1},
        {'channels' : 32, 'kernel_radius': 3, 'dilation': 1},
    ]

    # Create a dummy input tensor
    input_tensor = torch.randn(1, input_channels, 64, 64) # Batch size, Channels, Height, Width

    # Create the MyNet model
    model = MyNet(num_classes = num_classes, input_channels = input_channels, decoder_channels = decoder_channels, layers_config = layers_config, pdf_config = pdf_config, combining_channels = combining_channels)

    # Forward pass
    output_tensor = model(input_tensor)
    print(f"Input shape: {input_tensor.shape}")
    print(f"Output shape: {output_tensor.shape}")

    # Count the parameters
    total_params = model.count_parameters()
    print(f"Total number of parameters: {total_params}")
