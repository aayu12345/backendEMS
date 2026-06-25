package com.example.employeemanager.service;

import com.example.employeemanager.model.Attendance;
import com.example.employeemanager.repository.AttendanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import com.example.employeemanager.repository.UserRepository;

@Service
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Attendance markAttendance(java.util.Map<String, String> request, String currentUserEmail) {
        String reqEmpId = request.get("employeeId");
        String dateStr = request.get("date");
        String status = request.get("status");
        String clockIn = request.get("clockIn");
        String clockOut = request.get("clockOut");
        String leaveReason = request.get("leaveReason");

        String empId = reqEmpId;
        String empName = "Unknown";

        if (empId == null) {
            if (currentUserEmail == null) {
                throw new IllegalArgumentException("Authentication required");
            }
            com.example.employeemanager.model.User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            empId = user.getEmployeeId();
            empName = user.getName();
        } else {
            // Find name by employeeId
            com.example.employeemanager.model.User user = userRepository.findAll().stream()
                .filter(u -> reqEmpId.equals(u.getEmployeeId()))
                .findFirst()
                .orElse(null);
            if (user != null) {
                empName = user.getName();
            }
        }

        LocalDate date = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();

        Attendance log = attendanceRepository.findByEmployeeIdAndDate(empId, date).orElse(null);
        if (log == null) {
            log = new Attendance(
                UUID.randomUUID().toString(),
                empId,
                empName,
                date,
                status,
                clockIn,
                clockOut,
                0.0,
                leaveReason
            );
        } else {
            if (status != null) log.setStatus(status);
            if (clockIn != null) log.setCheckIn(clockIn);
            if (clockOut != null) log.setCheckOut(clockOut);
            if (leaveReason != null) log.setLeaveReason(leaveReason);
        }

        // Recalculate total hours if both are present
        if (log.getCheckIn() != null && log.getCheckOut() != null) {
            try {
                // Ensure time is formatted as HH:mm
                String inStr = log.getCheckIn().length() > 5 ? log.getCheckIn().substring(0, 5) : log.getCheckIn();
                String outStr = log.getCheckOut().length() > 5 ? log.getCheckOut().substring(0, 5) : log.getCheckOut();
                
                LocalTime in = LocalTime.parse(inStr, DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime out = LocalTime.parse(outStr, DateTimeFormatter.ofPattern("HH:mm"));
                long minutes = ChronoUnit.MINUTES.between(in, out);
                double hours = Math.round((minutes / 60.0) * 10.0) / 10.0;
                log.setTotalHours(hours > 0 ? hours : 8.0);
            } catch (Exception e) {
                log.setTotalHours(8.0);
            }
        }

        return attendanceRepository.save(log);
    }
}
