import React, {useState, createRef} from "react";
import Cropper, {ReactCropperElement} from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./crop.css";


interface CropProps {
    defaultSrc: string;
    onCropComplete?: (croppedImage: any) => void;
    onClose?: () => void;
}

export const Crop: React.FC<CropProps> = ({defaultSrc, onCropComplete, onClose}) => {
    const [image, setImage] = useState(defaultSrc);
    const [cropData, setCropData] = useState("#");
    const cropperRef = createRef<ReactCropperElement>();
    const onChange = (e: any) => {
        e.preventDefault();
        let files;
        if (e.dataTransfer) {
            files = e.dataTransfer.files;
        } else if (e.target) {
            files = e.target.files;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as any);
        };
        reader.readAsDataURL(files[0]);
    };

    const getCropData = () => {
        if (typeof cropperRef.current?.cropper !== "undefined") {
            const croppedDataUrl = cropperRef.current?.cropper.getCroppedCanvas().toDataURL();
            // console.log(cropperRef.current?.cropper)
            // console.log(cropperRef.current?.cropper.getCroppedCanvas().width)
            setCropData(croppedDataUrl);

            // If a callback is provided, call it with the cropped image
            if (onCropComplete) {
                onCropComplete({
                    croppedDataUrl,
                    w: cropperRef.current?.cropper.getCroppedCanvas().width,
                    h: cropperRef.current?.cropper.getCroppedCanvas().height,
                });
            }
        }
    };

    return (
        <div>
            <div style={{width: "100%"}}>
                <input type="file" onChange={onChange}/>
                <button onClick={() => setImage(defaultSrc)}>Use current frame</button>
                <br/>
                <br/>
                <Cropper
                    ref={cropperRef}
                    style={{height: 400, width: "100%"}}
                    zoomTo={0.5}
                    initialAspectRatio={1}
                    preview=".img-preview"
                    src={image}
                    viewMode={1}
                    minCropBoxHeight={10}
                    minCropBoxWidth={10}
                    background={false}
                    responsive={true}
                    autoCropArea={1}
                    checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
                    guides={true}
                />
            </div>
            <div>
                <div className="box" style={{width: "50%", float: "right"}}>
                    <h1>Preview</h1>
                    <div
                        className="img-preview"
                        style={{width: "100%", float: "left", height: "300px"}}
                    />
                </div>
                <div
                    className="box"
                    style={{width: "50%", float: "right", height: "300px"}}
                >
                    <h1>
                        <span>Crop</span>
                        <button style={{float: "right"}} onClick={getCropData}>
                            Apply Crop
                        </button>
                    </h1>
                    <img style={{width: "100%"}} src={cropData} alt="cropped"/>
                </div>
            </div>
            <br style={{clear: "both"}}/>
            {onClose && (
                <div className="mt-4 text-center">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={onClose}
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default Crop;
