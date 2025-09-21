package com.mobile;

import android.os.Bundle;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        setupSliders();
    }
    
    private String getResourceStatus(int progress) {
        if (progress < 20) return "critical";
        if (progress < 40) return "low";
        if (progress < 60) return "adequate";
        return "adequate";
    }
    
    private String getShelterStatus(int progress) {
        if (progress < 20) return "available";
        if (progress < 40) return "available";
        if (progress < 60) return "limited";
        if (progress < 80) return "limited";
        return "full";
    }
    
    private void setupSliders() {
        SeekBar capacitySlider = findViewById(R.id.capacitySlider);
        TextView capacityValue = findViewById(R.id.capacityValue);
        
        SeekBar foodSlider = findViewById(R.id.foodSlider);
        TextView foodValue = findViewById(R.id.foodValue);
        
        SeekBar waterSlider = findViewById(R.id.waterSlider);
        TextView waterValue = findViewById(R.id.waterValue);
        
        SeekBar medicalSlider = findViewById(R.id.medicalSlider);
        TextView medicalValue = findViewById(R.id.medicalValue);
        
        capacitySlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                String status;
                int color;
                if (progress < 20) {
                    status = "EMPTY"; color = 0xFF10B981;
                } else if (progress < 40) {
                    status = "LOW"; color = 0xFF22C55E;
                } else if (progress < 60) {
                    status = "HALF FULL"; color = 0xFFF59E0B;
                } else if (progress < 80) {
                    status = "BUSY"; color = 0xFFEF4444;
                } else {
                    status = "FULL"; color = 0xFFDC2626;
                }
                capacityValue.setText(progress + "% - " + status);
                capacityValue.setTextColor(color);
            }
            public void onStartTrackingTouch(SeekBar seekBar) {}
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
        
        foodSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                String status;
                int color;
                if (progress < 20) {
                    status = "CRITICAL"; color = 0xFFDC2626;
                } else if (progress < 40) {
                    status = "LOW"; color = 0xFFEF4444;
                } else if (progress < 60) {
                    status = "ADEQUATE"; color = 0xFFF59E0B;
                } else if (progress < 80) {
                    status = "GOOD"; color = 0xFF22C55E;
                } else {
                    status = "EXCELLENT"; color = 0xFF10B981;
                }
                foodValue.setText(progress + "% - " + status);
                foodValue.setTextColor(color);
            }
            public void onStartTrackingTouch(SeekBar seekBar) {}
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
        
        waterSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                String status;
                int color;
                if (progress < 20) {
                    status = "CRITICAL"; color = 0xFFDC2626;
                } else if (progress < 40) {
                    status = "LOW"; color = 0xFFEF4444;
                } else if (progress < 60) {
                    status = "SUFFICIENT"; color = 0xFFF59E0B;
                } else if (progress < 80) {
                    status = "GOOD"; color = 0xFF22C55E;
                } else {
                    status = "ABUNDANT"; color = 0xFF10B981;
                }
                waterValue.setText(progress + "% - " + status);
                waterValue.setTextColor(color);
            }
            public void onStartTrackingTouch(SeekBar seekBar) {}
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
        
        medicalSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                String status;
                int color;
                if (progress < 20) {
                    status = "DEPLETED"; color = 0xFFDC2626;
                } else if (progress < 40) {
                    status = "MINIMAL"; color = 0xFFEF4444;
                } else if (progress < 60) {
                    status = "BASIC"; color = 0xFFF59E0B;
                } else if (progress < 80) {
                    status = "STOCKED"; color = 0xFF22C55E;
                } else {
                    status = "FULLY EQUIPPED"; color = 0xFF10B981;
                }
                medicalValue.setText(progress + "% - " + status);
                medicalValue.setTextColor(color);
            }
            public void onStartTrackingTouch(SeekBar seekBar) {}
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
        
        // Submit button listener
        Button submitButton = findViewById(R.id.submitButton);
        submitButton.setOnClickListener(v -> sendStatusUpdate());
    }
    
    private void sendStatusUpdate() {
        // Get current slider values
        SeekBar capacitySlider = findViewById(R.id.capacitySlider);
        SeekBar foodSlider = findViewById(R.id.foodSlider);
        SeekBar waterSlider = findViewById(R.id.waterSlider);
        SeekBar medicalSlider = findViewById(R.id.medicalSlider);
        
        int capacityProgress = capacitySlider.getProgress();
        int foodProgress = foodSlider.getProgress();
        int waterProgress = waterSlider.getProgress();
        int medicalProgress = medicalSlider.getProgress();
        
        // Create JSON payload matching backend API
        String json = "{" +
            "\"capacity\":{" +
                "\"current\":" + (capacityProgress * 2) + "," +
                "\"maximum\":200" +
            "}," +
            "\"resources\":{" +
                "\"food\":\"" + getResourceStatus(foodProgress) + "\"," +
                "\"water\":\"" + getResourceStatus(waterProgress) + "\"," +
                "\"medical\":\"" + getResourceStatus(medicalProgress) + "\"" +
            "}," +
            "\"status\":\"" + getShelterStatus(capacityProgress) + "\"," +
            "\"timestamp\":\"" + java.time.Instant.now().toString() + "\"" +
        "}";
        
        // Show confirmation
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
        builder.setTitle("Status Update Sent");
        builder.setMessage("Shelter status has been sent to rescue center.");
        builder.setPositiveButton("OK", null);
        builder.show();
    }
}